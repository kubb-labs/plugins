import { jsStringEscape } from '@internals/utils'
import type { ast } from '@kubb/core'
import { FunctionParams } from '@kubb/core'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PrinterFakerFactory } from '../printers/printerFaker.ts'
import type { PluginFaker } from '../types.ts'
import { resolveFakerTypeUsage } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  node: ast.SchemaNode
  printer: ast.Printer<PrinterFakerFactory>
  seed?: PluginFaker['options']['seed']
  description?: string
  canOverride: boolean
}

const OBJECT_TYPES = new Set<ast.SchemaNode['type']>(['object', 'intersection'])
const ARRAY_TYPES = new Set<ast.SchemaNode['type']>(['array'])
const SCALAR_TYPES = new Set<ast.SchemaNode['type']>([
  'string',
  'email',
  'url',
  'uuid',
  'number',
  'integer',
  'bigint',
  'boolean',
  'date',
  'time',
  'datetime',
  'blob',
  'enum',
])

export function Faker({ node, description, name, typeName, printer, seed, canOverride }: Props): KubbReactNode {
  const fakerText = printer.print(node) ?? 'undefined'

  const isArray = ARRAY_TYPES.has(node.type)
  const isObject = OBJECT_TYPES.has(node.type)
  const isTuple = node.type === 'tuple'
  const isScalar = SCALAR_TYPES.has(node.type)

  let fakerTextWithOverride = fakerText

  if (canOverride && isObject) {
    fakerTextWithOverride = `{
  ...${fakerText},
  ...(data || {})
}`
  }

  if (canOverride && isTuple) {
    fakerTextWithOverride = `data || ${fakerText}`
  }

  if (canOverride && isArray) {
    fakerTextWithOverride = `[
  ...${fakerText},
  ...(data || [])
]`
  }

  if (canOverride && isScalar) {
    fakerTextWithOverride = `data ?? ${fakerText}`
  }

  const { dataType, returnType: resolvedReturnType } = resolveFakerTypeUsage(node, typeName, canOverride)

  const usesData = /\bdata\b/.test(fakerTextWithOverride)
  const dataParamName = usesData ? 'data' : '_data'
  const params = FunctionParams.factory({
    [dataParamName]: {
      type: dataType,
      optional: true,
    },
  })

  const returnType = resolvedReturnType

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        export
        name={name}
        JSDoc={{ comments: [description ? `@description ${jsStringEscape(description)}` : undefined].filter(Boolean) }}
        params={canOverride ? params.toConstructor() : undefined}
        returnType={returnType}
      >
        {seed ? `faker.seed(${JSON.stringify(seed)})` : undefined}
        <br />
        {`return ${fakerTextWithOverride}`}
      </Function>
    </File.Source>
  )
}
