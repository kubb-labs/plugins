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

  const useGenericOverride = canOverride && isObject
  const fakerTextWithOverride = (() => {
    if (canOverride && isTuple) return `data || ${fakerText}`
    if (canOverride && isArray) return `[\n  ...${fakerText},\n  ...(data || [])\n]`
    if (canOverride && isScalar) return `data ?? ${fakerText}`
    return fakerText
  })()

  const { dataType, returnType: resolvedReturnType } = resolveFakerTypeUsage(node, typeName, canOverride)

  if (!useGenericOverride) {
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

  // Generate function with defaultFakeData structure
  const jsdoc = description ? `/**\n   * @description ${jsStringEscape(description)}\n   */\n  ` : ''
  const functionSignature = `${jsdoc}export function ${name}(data?: Partial<${typeName}>): Required<${typeName}>`

  const seedCode = seed ? `faker.seed(${JSON.stringify(seed)})\n  ` : ''

  // When the object node has properties that transitively reference a cyclic schema,
  // the printer emits memoizing getters for those properties. Spreading the object
  // literal would immediately invoke those getters, triggering recursive faker calls
  // and causing a stack overflow. Detect this upfront via ast helpers so we can
  // use Object.defineProperty-based merging instead of spread.
  const { cyclicSchemas, schemaName } = printer.options
  const hasGetters =
    node.type === 'object' &&
    !!cyclicSchemas &&
    (node.properties ?? []).some((p) => ast.containsCircularRef(p.schema, { circularSchemas: cyclicSchemas, excludeName: schemaName }))

  const functionBody = hasGetters
    ? `{
  ${seedCode}const defaultFakeData = ${fakerText}
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      Object.defineProperty(defaultFakeData, key, { value, configurable: true, writable: true, enumerable: true })
    }
  }
  return defaultFakeData as Required<${typeName}>
}`
    : `{
  ${seedCode}const defaultFakeData = ${fakerText}
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<${typeName}>
}`

  return (
    <File.Source name={name} isExportable isIndexable>
      {functionSignature}
      {functionBody}
    </File.Source>
  )
}
