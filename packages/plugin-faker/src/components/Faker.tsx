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
  let useGenericOverride = false

  if (canOverride && isObject) {
    useGenericOverride = true
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

  let functionSignature = ''
  let functionBody = ''

  if (useGenericOverride) {
    // Generate function with defaultFakeData structure
    const jsdoc = description ? `/**\n   * @description ${jsStringEscape(description)}\n   */\n  ` : ''
    functionSignature = `${jsdoc}export function ${name}(data?: Partial<${typeName}>): Required<${typeName}>`

    const seedCode = seed ? `faker.seed(${JSON.stringify(seed)})\n  ` : ''

    // When the object literal contains memoizing getters (cyclic properties), spreading
    // it would immediately invoke those getters – which triggers recursive faker calls and
    // causes an infinite-recursion stack overflow.  Instead, we return the object as-is and
    // merge overrides via Object.defineProperty so that getter-only properties can be
    // replaced without needing a setter.
    const hasGetters = /\bget [a-zA-Z_$]/.test(fakerText)

    if (hasGetters) {
      functionBody = `{
  ${seedCode}const defaultFakeData = ${fakerText}
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      Object.defineProperty(defaultFakeData, key, { value, configurable: true, writable: true, enumerable: true })
    }
  }
  return defaultFakeData as Required<${typeName}>
}`
    } else {
      functionBody = `{
  ${seedCode}const defaultFakeData = ${fakerText}
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<${typeName}>
}`
    }
  } else {
    const usesData = /\bdata\b/.test(fakerTextWithOverride)
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
          {`return ${fakerTextWithOverride}`}
        </Function>
      </File.Source>
    )
  }

  return (
    <File.Source name={name} isExportable isIndexable>
      {functionSignature}
      {functionBody}
    </File.Source>
  )
}
