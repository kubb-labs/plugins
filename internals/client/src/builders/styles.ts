import { isValidVarName } from '@internals/utils'
import { ast } from 'kubb/kit'

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
 * `style`; header and cookie use a fixed style (`simple` and `form`), so only `explode` is emitted
 * for them. `allowReserved` only applies to query parameters, and `contentType` to every location
 * except path.
 */
function serializeParameter(parameter: ast.ParameterNode): string | null {
  const parts: Array<string> = []
  if ((parameter.in === 'path' || parameter.in === 'query') && parameter.style) parts.push(`style: '${parameter.style}'`)
  if (parameter.explode !== undefined) parts.push(`explode: ${parameter.explode}`)
  if (parameter.in === 'query' && parameter.allowReserved !== undefined) parts.push(`allowReserved: ${parameter.allowReserved}`)
  if (parameter.in !== 'path' && parameter.contentType) parts.push(`contentType: '${parameter.contentType}'`)
  return parts.length > 0 ? `{ ${parts.join(', ')} }` : null
}

/**
 * Serializes the `encoding` of the request body's default content type into a `{ property: { ... } }`
 * literal, or `null` when it carries none. Only an operation with a single request content type
 * emits it, because the runtime applies `styles.body` to whichever type the caller selects.
 */
function serializeBodyEncoding(node: ast.HttpOperationNode): string | null {
  const content = node.requestBody?.content
  const entries = Object.entries(content?.length === 1 ? (content[0]?.encoding ?? {}) : {}).map(
    ([property, { contentType, style, explode, allowReserved }]) => {
      const parts = [
        style && `style: ${JSON.stringify(style)}`,
        explode !== undefined && `explode: ${explode}`,
        allowReserved !== undefined && `allowReserved: ${allowReserved}`,
        contentType && `contentType: ${JSON.stringify(contentType)}`,
      ].filter(Boolean)
      return `${isValidVarName(property) ? property : JSON.stringify(property)}: { ${parts.join(', ')} }`
    },
  )

  return entries.length > 0 ? `body: { ${entries.join(', ')} }` : null
}

/**
 * Builds the per-operation `styles` literal from the operation's parameters, grouped by location.
 * Entries are keyed by the spec name of the parameter.
 * Only parameters whose source defines `style`, `explode`, `allowReserved`, or `contentType` are
 * emitted, so calls without serialization metadata keep the runtime defaults and existing output
 * is unchanged. A form request body adds a `body` group keyed by property name from its `encoding`.
 * Returns `null` when nothing carries metadata.
 *
 * @example
 * ```ts
 * // a path param with { style: 'matrix', explode: true } and a query param with { explode: false }
 * buildStyles({ node }) // "{ path: { id: { style: 'matrix', explode: true } }, query: { tags: { explode: false } } }"
 * ```
 */
export function buildStyles({ node }: { node: ast.OperationNode }): string | null {
  if (!ast.isHttpOperationNode(node)) return null

  const groups: Record<StyledLocation, Array<string>> = { path: [], query: [], header: [], cookie: [] }

  for (const parameter of node.parameters) {
    const literal = serializeParameter(parameter)
    if (!literal) continue
    groups[parameter.in].push(`${toKey(parameter.name)}: ${literal}`)
  }

  const entries = [
    ...(Object.keys(groups) as Array<StyledLocation>)
      .filter((location) => groups[location].length > 0)
      .map((location) => `${location}: { ${groups[location].join(', ')} }`),
    serializeBodyEncoding(node),
  ].filter(Boolean)

  return entries.length > 0 ? `{ ${entries.join(', ')} }` : null
}
