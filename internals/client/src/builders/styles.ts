import { camelCase, isValidVarName } from '@internals/utils'
import { ast } from 'kubb/kit'

type StyledLocation = 'path' | 'query' | 'header' | 'cookie'

/**
 * Renders a parameter name as an object-literal key, quoted when it is not a bare identifier.
 * Path keys are camelCased to match the URL template placeholders. Query, header, and cookie keys
 * keep the spec name, matching the remapped keys the runtime serializes.
 */
function toKey(name: string, location: StyledLocation): string {
  const key = location === 'path' ? camelCase(name) : name
  return isValidVarName(key) ? key : JSON.stringify(key)
}

/**
 * Serializes one parameter's metadata into a `{ style, explode }` literal, or `null` when the
 * parameter carries neither. Path and query carry the serialization `style`; header and cookie use a
 * fixed style (`simple` and `form`), so only `explode` is emitted for them.
 */
function serializeParameter(parameter: ast.ParameterNode): string | null {
  const parts: Array<string> = []
  if ((parameter.in === 'path' || parameter.in === 'query') && parameter.style) parts.push(`style: '${parameter.style}'`)
  if (parameter.explode !== undefined) parts.push(`explode: ${parameter.explode}`)
  return parts.length > 0 ? `{ ${parts.join(', ')} }` : null
}

/**
 * Builds the per-operation `styles` literal from the operation's parameters, grouped by location.
 * Path entries are keyed by the camelCased name to match the URL template placeholders; query,
 * header, and cookie entries keep the spec name to match the keys the runtime serializes.
 * Only parameters whose source defines `style` or `explode` are emitted, so calls without
 * serialization metadata keep the runtime defaults and existing output is unchanged. Returns `null`
 * when no parameter carries metadata.
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
    groups[parameter.in].push(`${toKey(parameter.name, parameter.in)}: ${literal}`)
  }

  const locations = (Object.keys(groups) as Array<StyledLocation>).filter((location) => groups[location].length > 0)
  if (locations.length === 0) return null

  return `{ ${locations.map((location) => `${location}: { ${groups[location].join(', ')} }`).join(', ')} }`
}
