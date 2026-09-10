import { jsStringEscape } from '@internals/utils'
import { containsCircularRef } from 'kubb/kit'
import type { ast } from 'kubb/kit'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { PrinterFakerFactory } from '../printers/printerFaker.ts'
import { resolveFakerTypeUsage } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  node: ast.SchemaNode
  printer: ast.Printer<PrinterFakerFactory>
  description?: string
  canOverride: boolean
}

const OBJECT_TYPES = new Set<ast.SchemaNode['type']>(['object', 'intersection'])
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

export function Faker({ node, description, name, typeName, printer, canOverride }: Props): KubbReactNode {
  const fakerText = printer.print(node) ?? 'undefined'

  const isArray = node.type === 'array'
  const isObject = OBJECT_TYPES.has(node.type)
  const isTuple = node.type === 'tuple'
  const isScalar = SCALAR_TYPES.has(node.type)
  const isUnion = node.type === 'union'

  const useGenericOverride = canOverride && isObject
  const fakerTextWithOverride = (() => {
    if (canOverride && isTuple) return `data || ${fakerText}`
    if (canOverride && isArray) return `[\n  ...${fakerText},\n  ...(data || [])\n]`
    if (canOverride && isScalar) return `data ?? ${fakerText}`
    return fakerText
  })()

  const { dataType, returnType: resolvedReturnType } = resolveFakerTypeUsage(node, typeName, canOverride)

  const unionBody =
    canOverride && isUnion && resolvedReturnType
      ? `const defaultFakeData: unknown = ${fakerText}
if (data && defaultFakeData && typeof defaultFakeData === 'object' && !Array.isArray(defaultFakeData)) {
  return { ...defaultFakeData, ...data } as ${resolvedReturnType}
}
return (data ?? defaultFakeData) as ${resolvedReturnType}`
      : null

  if (!useGenericOverride) {
    const usesData = !!unionBody || /\bdata\b/.test(fakerTextWithOverride)
    const dataParamName = usesData ? 'data' : '_data'
    const params = createFunctionParameters({
      params: [
        createFunctionParameter({
          name: dataParamName,
          type: dataType,
          optional: true,
        }),
      ],
    })
    const paramsSignature = declarationPrinter.print(params) ?? ''
    const returnType = resolvedReturnType

    // Merging a `Partial<T>` override never produces `T` on its own: a `ref` wrapper gets
    // the widened return of the generic object faker it delegates to, and an array or tuple
    // that spreads `Partial<T>` picks up the optional holes. Cast back to the declared
    // return type in both cases.
    const needsCast = canOverride && !!returnType && (node.type === 'ref' || isArray || isTuple)
    const returnExpression = needsCast ? `${fakerTextWithOverride} as ${returnType}` : fakerTextWithOverride

    return (
      <File.Source name={name} isExportable isIndexable>
        <Function
          export
          name={name}
          JSDoc={{ comments: description ? [`@description ${jsStringEscape(description)}`] : [] }}
          params={canOverride ? paramsSignature : undefined}
          returnType={returnType ?? undefined}
        >
          {unionBody ?? `return ${returnExpression}`}
        </Function>
      </File.Source>
    )
  }

  // Generate function with defaultFakeData structure
  const jsdoc = description ? `/**\n   * @description ${jsStringEscape(description)}\n   */\n  ` : ''
  const functionSignature = `${jsdoc}export function ${name}<TData extends Partial<${typeName}> = object>(data?: TData)`

  // When the object node has properties that transitively reference a cyclic schema,
  // the printer emits memoizing getters for those properties. Spreading the object
  // literal would immediately invoke those getters, triggering recursive faker calls
  // and causing a stack overflow. Detect this upfront via ast helpers so we can
  // use Object.defineProperty-based merging instead of spread.
  const { cyclicSchemas, schemaName } = printer.options
  const hasGetters =
    node.type === 'object' &&
    !!cyclicSchemas &&
    (node.properties ?? []).some((p) => containsCircularRef(p.schema, { circularSchemas: cyclicSchemas, excludeName: schemaName }))

  const functionBody = hasGetters
    ? `{
  const defaultFakeData = ${fakerText}
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      Object.defineProperty(defaultFakeData, key, { value, configurable: true, writable: true, enumerable: true })
    }
  }
  return defaultFakeData as Omit<typeof defaultFakeData, keyof TData> & TData
}`
    : `{
  const defaultFakeData = ${fakerText}
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}`

  return (
    <File.Source name={name} isExportable isIndexable>
      {functionSignature}
      {functionBody}
    </File.Source>
  )
}
