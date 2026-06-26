import { camelCase } from '@internals/utils'
import { ast } from '@kubb/core'

type StyledLocation = 'path' | 'query' | 'header' | 'cookie'

/**
 * Serializes one parameter's metadata into a `{ style, explode }` literal. Path and query carry the
 * serialization `style`; header and cookie use a fixed style (`simple` and `form`), so only `explode`
 * is emitted for them.
 */
function serializeParameter(parameter: ast.ParameterNode): string {
  const parts: Array<string> = []
  if ((parameter.in === 'path' || parameter.in === 'query') && parameter.style) parts.push(`style: '${parameter.style}'`)
  if (parameter.explode !== undefined) parts.push(`explode: ${parameter.explode}`)
  return `{ ${parts.join(', ')} }`
}

/**
 * Builds the per-operation `styles` literal from the operation's parameters, grouped by location and
 * keyed by the camelCased parameter name to match the generated `path` / `query` / `headers` keys.
 * Only parameters whose source defines `style` or `explode` are emitted, so calls without
 * serialization metadata keep the runtime defaults and existing output is unchanged. Returns `null`
 * when no parameter carries metadata.
 *
 * @example
 * ```ts
 * // a path param with { style: 'matrix', explode: true } and a query param with { explode: false }
 * buildStylesMetadata({ node }) // "{ path: { id: { style: 'matrix', explode: true } }, query: { tags: { explode: false } } }"
 * ```
 */
export function buildStylesMetadata({ node }: { node: ast.OperationNode }): string | null {
  if (!ast.isHttpOperationNode(node)) return null

  const groups: Record<StyledLocation, Array<string>> = { path: [], query: [], header: [], cookie: [] }

  for (const parameter of node.parameters) {
    const carriesStyle = (parameter.in === 'path' || parameter.in === 'query') && parameter.style !== undefined
    if (!carriesStyle && parameter.explode === undefined) continue
    groups[parameter.in].push(`${camelCase(parameter.name)}: ${serializeParameter(parameter)}`)
  }

  const locations = (['path', 'query', 'header', 'cookie'] as const).filter((location) => groups[location].length > 0)
  if (locations.length === 0) return null

  return `{ ${locations.map((location) => `${location}: { ${groups[location].join(', ')} }`).join(', ')} }`
}
