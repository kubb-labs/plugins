import { jsStringEscape } from '@internals/utils'
import { ast } from '@kubb/core'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PrinterFakerFactory } from '../printers/printerFaker.ts'
import type { PluginFaker } from '../types.ts'

type Props = {
  name: string
  typeName: string
  node: ast.SchemaNode
  printer: ast.Printer<PrinterFakerFactory>
  seed?: PluginFaker['options']['seed']
  description?: string
  canOverride: boolean
}

const ARRAY_TYPES = new Set<ast.SchemaNode['type']>(['array'])
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

function getScalarType(node: ast.SchemaNode, typeName: string): string {
  switch (node.type) {
    case 'string':
    case 'email':
    case 'url':
    case 'uuid':
      return 'string'
    case 'number':
    case 'integer':
      return 'number'
    case 'bigint':
      return 'bigint'
    case 'boolean':
      return 'boolean'
    case 'date':
    case 'time':
      return node.representation === 'date' ? 'Date' : 'string'
    case 'datetime':
      return 'string'
    case 'blob':
      return 'Blob'
    case 'enum':
      return typeName
    default:
      return typeName
  }
}

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

  let dataType = `Partial<${typeName}>`

  if (isArray || isTuple || node.type === 'union' || node.type === 'enum') {
    dataType = typeName
  }

  if (isScalar) {
    dataType = getScalarType(node, typeName)
  }

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

  let returnType = canOverride ? typeName : undefined

  if (isScalar) {
    returnType = getScalarType(node, typeName)
  }

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
        {`return ${fakerTextWithOverride}`}
      </Function>
    </File.Source>
  )
}
