import { jsDocEscape, objectKey } from '@internals/utils'
import { ast, containsCircularRef } from 'kubb/kit'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { PrinterFakerFactory } from '../printers/printerFaker.ts'
import type { PluginFaker } from '../types.ts'
import { isObjectSchema, resolveFakerTypeUsage, SCALAR_TYPES } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  node: ast.SchemaNode
  printer: ast.Printer<PrinterFakerFactory>
  description?: string
  canOverride: boolean
  typeMode?: PluginFaker['resolvedOptions']['typeMode']
  keysToOmit?: Array<string> | null
}

export function Faker({ node, description, name, typeName, printer, canOverride, typeMode = 'inferred', keysToOmit }: Props): KubbReactNode {
  const fakerText = printer.print(node) ?? 'undefined'

  const isArray = node.type === 'array'
  const isObject = !!ast.narrowSchema(node, ast.schemaTypes.object) || (node.type === ast.schemaTypes.intersection && isObjectSchema(node))
  const isValueIntersection = node.type === ast.schemaTypes.intersection && !isObject
  const isTuple = node.type === 'tuple'
  const isScalar = SCALAR_TYPES.has(node.type)
  const isUnion = node.type === 'union'

  const useObjectOverride = canOverride && (isObject || !!keysToOmit?.length)
  const fakerTextWithOverride = (() => {
    if (canOverride && node.type === 'tuple') {
      return `data && data.length === ${node.items?.length ?? 0} && !data.includes(undefined) ? data : ${fakerText}`
    }
    if (canOverride && isArray) return `[\n  ...${fakerText},\n  ...(data || []).filter((item) => item !== undefined),\n]`
    // `??` treats an explicit `null` as "not provided", so a nullable factory could never return
    // the `null` its own signature promises. Only `undefined` means "generate one".
    if (canOverride && (isScalar || isUnion || isValueIntersection)) {
      return node.nullable ? `data !== undefined ? data : ${fakerText}` : `data ?? ${fakerText}`
    }
    return fakerText
  })()

  const { dataType, returnType: resolvedReturnType } = resolveFakerTypeUsage(node, typeName, canOverride)

  if (!useObjectOverride) {
    const usesData = /\bdata\b/.test(fakerTextWithOverride)
    const dataParamName = usesData ? 'data' : '_data'
    const paramsSignature = `${dataParamName}?: ${dataType}`
    const returnType = resolvedReturnType

    // `as` binds tighter than `??`/`?:`, so tuple/union need parens or `data`'s own type leaks through.
    const needsCast = canOverride && !!returnType && ((node.type === 'ref' && !SCALAR_TYPES.has(ast.resolveRef(node).type)) || isArray || isTuple || isUnion)
    const needsParens = isTuple || isUnion
    const returnExpression = needsCast ? `${needsParens ? `(${fakerTextWithOverride})` : fakerTextWithOverride} as ${returnType}` : fakerTextWithOverride

    return (
      <File.Source name={name} isExportable isIndexable>
        <Function
          export
          name={name}
          JSDoc={{ comments: description ? [`@description ${jsDocEscape(description)}`] : [] }}
          params={canOverride ? paramsSignature : undefined}
          returnType={returnType ?? undefined}
        >
          {`return ${returnExpression}`}
        </Function>
      </File.Source>
    )
  }

  // Generate function with defaultFakeData structure
  const { cyclicSchemas, schemaName } = printer.options
  const isCyclic = !!schemaName && !!cyclicSchemas?.has(schemaName)
  const baseType = isCyclic ? typeName : 'typeof defaultFakeData'
  const returnType = typeMode === 'schema' ? typeName : `Omit<${baseType}, keyof NoInfer<TData>> & NoInfer<TData>`

  // When the object node has properties that transitively reference a cyclic schema,
  // the printer emits memoizing getters for those properties. Spreading the object
  // literal would immediately invoke those getters, triggering recursive faker calls
  // and causing a stack overflow. Detect this upfront via ast helpers so we can
  // use Object.defineProperty-based merging instead of spread.
  const hasGetters =
    node.type === 'object' &&
    !!cyclicSchemas &&
    (node.properties ?? []).some((p) => containsCircularRef(p.schema, { circularSchemas: cyclicSchemas, excludeName: schemaName }))

  const defaults = keysToOmit?.length
    ? `{ ${keysToOmit.map((key, index) => `${objectKey(key)}: _omit${index}`).join(', ')}, ...defaultFakeData }`
    : 'defaultFakeData'
  const declaration = `const ${defaults} = ${fakerText}`
  const functionBody = hasGetters
    ? `${declaration}
if (data) {
  for (const [key, value] of Object.entries(data)) {
    Object.defineProperty(defaultFakeData, key, { value, configurable: true, writable: true, enumerable: true })
  }
}
return defaultFakeData as ${returnType}`
    : `${declaration}
return {
  ...defaultFakeData,
  ...(data || {}),
} as ${returnType}`

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        export
        name={name}
        JSDoc={{ comments: description ? [`@description ${jsDocEscape(description)}`] : [] }}
        generics={typeMode === 'schema' ? undefined : `TData extends Partial<${typeName}> = object`}
        params={typeMode === 'schema' ? `data?: Partial<${typeName}>` : 'data?: TData'}
        returnType={typeMode === 'schema' || isCyclic ? returnType : undefined}
      >
        {functionBody}
      </Function>
    </File.Source>
  )
}
