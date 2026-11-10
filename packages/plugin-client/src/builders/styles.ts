import { getOperationParameters } from '@internals/shared'
import { isValidVarName, singleQuote } from '@internals/utils'
import { ast } from '@kubb/kit'

type StyledLocation = 'path' | 'query' | 'header' | 'cookie'

/**
 * Renders a parameter name as an object-literal key, quoted when it is not a bare identifier. Every
 * location keeps the spec name: the runtime looks path styles up by the `{name}` placeholder in the
 * URL, and the other locations by the key it serializes.
 */
function toKey(name: string): string {
  return isValidVarName(name) ? name : JSON.stringify(name)
}

/**
 * Serializes one parameter's metadata into a `{ style, explode, allowReserved, contentType }`
 * literal, or `null` when the parameter carries none. Path and query carry the serialization
 * `style`. Header and cookie have a fixed style (`simple` and `form`), so they emit only `explode`,
 * plus `style: 'cookie'` when a cookie parameter sets the OpenAPI 3.2 `cookie` style.
 * `allowReserved` only applies to query parameters, and `contentType` to every location except path.
 */
function serializeParameter(parameter: ast.ParameterNode): string | null {
  const parts: Array<string> = []
  if ((parameter.in === 'path' || parameter.in === 'query') && parameter.style) parts.push(`style: '${parameter.style}'`)
  if (parameter.in === 'cookie' && parameter.style === 'cookie') parts.push(`style: 'cookie'`)
  if (parameter.explode !== undefined) parts.push(`explode: ${parameter.explode}`)
  if (parameter.in === 'query' && parameter.allowReserved !== undefined) parts.push(`allowReserved: ${parameter.allowReserved}`)
  if (parameter.in !== 'path' && parameter.contentType) parts.push(`contentType: '${parameter.contentType}'`)
  if (parameter.in === 'querystring') parts.push('querystring: true')
  return parts.length > 0 ? `{ ${parts.join(', ')} }` : null
}

/**
 * Serializes the `encoding` of the request body's default content type into `property: { ... }`
 * entries, empty when it carries none. Only an operation with a single request content type
 * emits it, because the runtime applies `styles.body` to whichever type the caller selects.
 */
function serializeBodyEncoding(node: ast.HttpOperationNode): Array<string> {
  const content = node.requestBody?.content
  return Object.entries(content?.length === 1 ? (content[0]?.encoding ?? {}) : {}).map(([property, { contentType, style, explode, allowReserved }]) => {
    const parts = [
      style && `style: ${JSON.stringify(style)}`,
      explode !== undefined && `explode: ${explode}`,
      allowReserved !== undefined && `allowReserved: ${allowReserved}`,
      contentType && `contentType: ${JSON.stringify(contentType)}`,
    ].filter(Boolean)
    return `${isValidVarName(property) ? property : JSON.stringify(property)}: { ${parts.join(', ')} }`
  })
}

function serializePartsEncoding(node: ast.HttpOperationNode): Array<string> {
  // Only the `multipart/mixed` media type reads `parts`, whichever position it has among the request content types.
  const entry = node.requestBody?.content?.find((content) => content.contentType.split(';')[0]!.trim().toLowerCase() === 'multipart/mixed')
  const part = (encoding: ast.EncodingNode) => (encoding.contentType ? `{ contentType: ${singleQuote(encoding.contentType)} }` : '{}')
  return [
    ...(entry?.prefixEncoding?.length ? [`prefix: [${entry.prefixEncoding.map(part).join(', ')}]`] : []),
    ...(entry?.itemEncoding?.contentType ? [`item: ${part(entry.itemEncoding)}`] : []),
  ]
}

/**
 * Builds the per-operation `styles` literal from the operation's parameters, grouped by location.
 * Entries are keyed by the spec name of the parameter.
 * Only parameters whose source defines `style`, `explode`, `allowReserved`, or `contentType` are
 * emitted, so calls without serialization metadata keep the runtime defaults and existing output
 * is unchanged. A form request body adds a `body` group keyed by property name from its `encoding`,
 * and a `multipart/mixed` body a `parts` group with its `prefix` and `item` encoding.
 * Returns `null` when nothing carries metadata.
 *
 * With `merge`, the literal spreads `config.styles` per parameter, so a per-call entry overrides the generated one for
 * that parameter and leaves the others in place.
 *
 * @example
 * ```ts
 * // a path param with { style: 'matrix', explode: true } and a query param with { explode: false }
 * buildStyles({ node }) // "{ path: { id: { style: 'matrix', explode: true } }, query: { tags: { explode: false } } }"
 * ```
 */
export function buildStyles({ node, merge }: { node: ast.OperationNode; merge?: boolean }): string | null {
  if (!ast.isHttpOperationNode(node)) return null

  const groups: Record<StyledLocation | 'body' | 'parts', Array<string>> = {
    path: [],
    query: [],
    header: [],
    cookie: [],
    body: serializeBodyEncoding(node),
    parts: serializePartsEncoding(node),
  }

  for (const [location, parameters] of Object.entries(getOperationParameters(node)) as Array<[StyledLocation, Array<ast.ParameterNode>]>) {
    for (const parameter of parameters) {
      const literal = serializeParameter(parameter)
      if (literal) groups[location].push(`${toKey(parameter.name)}: ${literal}`)
    }
  }

  const entries = Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([location, items]) => `${location}: { ${(merge ? [...items, `...config.styles?.${location}`] : items).join(', ')} }`)

  if (entries.length === 0) return null
  return `{ ${(merge ? ['...config.styles', ...entries] : entries).join(', ')} }`
}
