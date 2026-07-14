import type { ast } from 'kubb/kit'

/**
 * Drops parameters that share the same name, keeping the first.
 *
 * A malformed spec can declare the same parameter name twice within one `in` location. Both would
 * resolve to the same output property, so emitting both would yield an object type with a duplicate
 * member, which TypeScript rejects. This is a defensive guard against that case, not a casing guard:
 * parameter names flow through unchanged, so no two distinct names ever collide here anymore.
 */
export function dedupeParams(params: Array<ast.ParameterNode>): Array<ast.ParameterNode> {
  const seen = new Set<string>()

  return params.filter((param) => {
    if (seen.has(param.name)) return false
    seen.add(param.name)
    return true
  })
}
