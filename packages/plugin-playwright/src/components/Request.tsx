import { getRequestGroupOptionality } from '@internals/shared'
import { File, Function, type KubbReactNode } from 'kubb/jsx'
import type { ast } from 'kubb/kit'

type Props = {
  name: string
  node: ast.HttpOperationNode
  responseType: string
  pathType?: string
  queryType?: string
  headersType?: string
  bodyType?: string
  contentType?: string
  baseURL?: string
}

function isNativeValue({ schema, types = ['string', 'number', 'integer', 'boolean'] }: { schema: ast.SchemaNode; types?: Array<string> }): boolean {
  if (schema.nullable || schema.nullish || schema.type === 'blob') return false
  if (schema.type === 'ref') return schema.schema ? isNativeValue({ schema: schema.schema, types }) : false
  if ((schema.type === 'date' || schema.type === 'time') && schema.representation === 'date') return false
  return types.includes(schema.primitive ?? schema.type)
}

/**
 * Prints a request that returns Playwright's response without reading its body.
 */
export function Request({ name, node, responseType, pathType, queryType, headersType, bodyType, contentType, baseURL }: Props): KubbReactNode {
  const { hasRequiredPath, hasRequiredQuery, hasRequiredHeader } = getRequestGroupOptionality(node)
  const names = ['request']
  const types = ['request: APIRequestContext']
  for (const [group, type, required] of [
    ['path', pathType, hasRequiredPath],
    ['query', queryType, hasRequiredQuery],
    ['body', bodyType, node.requestBody?.required],
    ['headers', headersType, hasRequiredHeader],
  ] as const) {
    if (!type) continue
    names.push(group)
    types.push(`${group}${required ? '' : '?'}: ${type}`)
  }
  names.push('options')
  types.push("options?: Omit<NonNullable<Parameters<APIRequestContext['fetch']>[1]>, 'method'>")

  const url = node.path
    .split(/(\{[^}]+\})/)
    .filter(Boolean)
    .map((part) => (part.startsWith('{') ? `encodeURIComponent(String(path[${JSON.stringify(part.slice(1, -1))}]))` : JSON.stringify(part)))
  const prefix = baseURL?.replace(/\/+$/, '')
  if (prefix) url.unshift(JSON.stringify(prefix))

  const statements: Array<string> = []
  const fields: Array<string> = []

  if (queryType) {
    const needsSerialization = node.parameters.some((param) => param.in === 'query' && !isNativeValue({ schema: param.schema }))
    if (needsSerialization) {
      statements.push(`const params = new URLSearchParams()
for (const [key, value] of Object.entries(query ?? {})) {
  for (const item of Array.isArray(value) ? value : [value]) {
    if (item != null) params.append(key, String(item))
  }
}`)
      fields.push('params')
    } else {
      fields.push('params: query')
    }
  }

  if (headersType) {
    const needsSerialization = node.parameters.some((param) => param.in === 'header' && !isNativeValue({ schema: param.schema, types: ['string'] }))
    fields.push(
      needsSerialization
        ? `headers: Object.fromEntries(
  Object.entries(headers ?? {})
    .filter(([, value]) => value != null)
    .map(([key, value]) => [key, String(value)]),
)`
        : 'headers',
    )
  }

  if (bodyType) {
    const mediaType = contentType?.split(';')[0]?.trim().toLowerCase()
    const isForm = mediaType === 'application/x-www-form-urlencoded' || mediaType === 'multipart/form-data'
    let schema = node.requestBody?.content?.[0]?.schema
    if (schema?.type === 'ref') schema = schema.schema ?? undefined
    const needsFormData =
      isForm &&
      (schema?.type !== 'object' ||
        schema.nullable ||
        schema.nullish ||
        schema.properties.some((property) => !isNativeValue({ schema: property.schema })) ||
        schema.additionalProperties === true ||
        (typeof schema.additionalProperties === 'object' && !isNativeValue({ schema: schema.additionalProperties })))
    let value = 'body'
    if (needsFormData) {
      statements.push(`let form: FormData | undefined
if (body !== undefined) {
  form = new FormData()
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item != null) form.append(key, item instanceof Blob ? item : String(item))
    }
  }
}`)
      value = 'form'
    }
    let mode = 'data'
    if (mediaType === 'application/x-www-form-urlencoded') mode = 'form'
    if (mediaType === 'multipart/form-data') mode = 'multipart'
    fields.push(`${mode}: ${value}`)
  }

  fields.push('...options', `method: ${JSON.stringify(node.method)}`)
  statements.push(`return request.fetch<${responseType}>(${url.join(' + ') || "''"}, {
  ${fields.join(',\n  ')},
})`)

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={`{ ${names.join(', ')} }: { ${types.join('; ')} }`} returnType={`Promise<APIResponse<${responseType}>>`}>
        {statements.join('\n\n')}
      </Function>
    </File.Source>
  )
}
