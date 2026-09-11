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
    if (canOverride && node.type === 'tuple') {
      return `data && data.length === ${node.items?.length ?? 0} && !data.includes(undefined) ? data : ${fakerText}`
    }
    if (canOverride && isArray) return `[\n  ...${fakerText},\n  ...(data || []).filter((item) => item !== undefined),\n]`
    if (canOverride && (isScalar || isUnion)) return `data ?? ${fakerText}`
    return fakerText
  })()

  const { dataType, returnType: resolvedReturnType } = resolveFakerTypeUsage(node, typeName, canOverride)

  if (!useGenericOverride) {
    const usesData = /\bdata\b/.test(fakerTextWithOverride)
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

    // `as` binds tighter than `??`/`?:`, so tuple/union need parens or `data`'s own type leaks through.
    const needsCast = canOverride && !!returnType && (node.type === 'ref' || isArray || isTuple || isUnion)
    const needsParens = isTuple || isUnion
    const returnExpression = needsCast ? `${needsParens ? `(${fakerTextWithOverride})` : fakerTextWithOverride} as ${returnType}` : fakerTextWithOverride

    return (
      <File.Source name={name} isExportable isIndexable>
        <Function
          export
          name={name}
          JSDoc={{ comments: description ? [`@description ${jsStringEscape(description)}`] : [] }}
          params={canOverride ? paramsSignature : undefined}
          returnType={returnType ?? undefined}
        >
          {`return ${returnExpression}`}
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
