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

  // The printer emits `get prop() { ... }` for properties whose value would
  // recurse through a circular dependency. Using object spread here would
  // invoke those getters during construction (per ECMAScript spread semantics)
  // and reintroduce the recursion we just deferred. Use `Object.assign` instead
  // so the getters survive on the result object and a user override via `data`
  // replaces them as plain data properties before they're ever read.
  const hasGetters = /\bget\s+\w+\s*\(\s*\)\s*\{/.test(fakerText)

  let fakerTextWithOverride = fakerText
  let useObjectAssignShape = false

  if (canOverride && isObject) {
    if (hasGetters) {
      useObjectAssignShape = true
    } else {
      fakerTextWithOverride = `{
  ...${fakerText},
  ...(data || {})
}`
    }
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

  const usesData = useObjectAssignShape || /\bdata\b/.test(fakerTextWithOverride)
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

  const returnType = resolvedReturnType

  const body = useObjectAssignShape
    ? `const result: ${returnType} = ${fakerText}
if (data) Object.assign(result, data)
return result`
    : `return ${fakerTextWithOverride}`

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        export
        name={name}
        JSDoc={{ comments: [description ? `@description ${jsStringEscape(description)}` : undefined].filter(Boolean) }}
        params={canOverride ? paramsSignature : undefined}
        returnType={returnType}
      >
        {seed ? `faker.seed(${JSON.stringify(seed)})` : undefined}
        <br />
        {body}
      </Function>
    </File.Source>
  )
}
