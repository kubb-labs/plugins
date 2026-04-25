import { jsStringEscape } from '@internals/utils'
import { ast } from '@kubb/core'
import { functionPrinter } from '@kubb/plugin-ts'
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
const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function Faker({ node, description, name, typeName, printer, seed, canOverride }: Props): KubbReactNode {
  const fakerText = printer.print(node) ?? 'undefined'

  const isArray = ARRAY_TYPES.has(node.type)
  const isObject = OBJECT_TYPES.has(node.type)
  const isTuple = node.type === 'tuple'
  const isScalar = SCALAR_TYPES.has(node.type)

  let fakerTextWithOverride = fakerText
  let useObjectAssign = false

  if (canOverride && isObject) {
    // Always use Object.assign for objects to ensure proper type precision
    // Required<> marks all properties as required, reflecting that the faker generates all of them
    useObjectAssign = true
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

  const usesData = useObjectAssign || /\bdata\b/.test(fakerTextWithOverride)
  const dataParamName = usesData ? 'data' : '_data'
  const params = ast.createFunctionParameters({
    params: [
      ast.createFunctionParameter({
        name: dataParamName,
        type: ast.createParamsType({ variant: 'reference', name: dataType }),
        optional: true,
      }),
    ],
  })
  const paramsSignature = declarationPrinter.print(params) ?? ''

  // For objects with overrides, use Required<> to mark all generated properties as required
  const returnType = useObjectAssign ? `Required<${typeName}>` : resolvedReturnType

  const body = useObjectAssign ? `return { ...${fakerText}, ...data } as ${returnType}` : `return ${fakerTextWithOverride}`

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        export
        name={name}
        JSDoc={{ comments: description ? [`@description ${jsStringEscape(description)}`] : [] }}
        params={canOverride ? paramsSignature : undefined}
        returnType={returnType}
      >
        {seed ? (
          <>
            {`faker.seed(${JSON.stringify(seed)})`}
            <br />
          </>
        ) : undefined}
        {body}
      </Function>
    </File.Source>
  )
}
