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
  let useSpreadWithTypeAssertion = false

  if (canOverride && isObject) {
    if (hasGetters) {
      // When there are getters (circular refs), use Object.assign to avoid invoking them during spread
      useObjectAssignShape = true
    } else {
      // For regular objects without getters, use spread with precise type assertion
      useSpreadWithTypeAssertion = true
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

  const usesData = useObjectAssignShape || useSpreadWithTypeAssertion || /\bdata\b/.test(fakerTextWithOverride)
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

  // For objects with overrides, we need a more precise return type that marks generated properties as required
  const returnType = useSpreadWithTypeAssertion ? `typeof _defaults & Omit<${typeName}, keyof typeof _defaults>` : resolvedReturnType

  const body = useObjectAssignShape
    ? `const result: ${resolvedReturnType} = ${fakerText}
if (data) Object.assign(result, data)
return result`
    : useSpreadWithTypeAssertion
      ? `const _defaults = ${fakerText}
const result = { ..._defaults, ...(data || {}) } as ${returnType}
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
