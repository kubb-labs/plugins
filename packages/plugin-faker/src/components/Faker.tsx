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
    // When the printer emits getter properties (cyclic schemas), spreading defaultFakeData
    // would invoke the getters and cause infinite recursion (Cat → Pet → Cat → …).
    // Instead, build the result object directly and apply data overrides using
    // Object.defineProperties, which uses [[DefineOwnProperty]] and can safely override
    // configurable getters with plain value descriptors without ever reading the getters.
    const hasGetters = /\bget \w/.test(fakerText)
    if (hasGetters) {
      functionBody = `{
  ${seedCode}const result = ${fakerText}
  Object.defineProperties(result, Object.getOwnPropertyDescriptors(data || {}))
  return result as Required<${typeName}>
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
