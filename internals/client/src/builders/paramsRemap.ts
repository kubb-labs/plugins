import { buildParamsMapping, buildParamsRemapExpression, getOperationParameters } from '@internals/shared'
import { ast } from 'kubb/kit'

/**
 * Builds the call-config entries that rename the camelCased `query` and `headers` keys back to the
 * names the OpenAPI document declares, so the wire format follows the spec while the generated
 * types keep camelCase keys. Returns an empty array when no name changes. Path parameters need no
 * remap because the URL template placeholders are renamed in sync with the `path` keys. Emit the
 * entries after the `...config` spread so they override the camelCased groups the caller passes in.
 *
 * @example
 * ```ts
 * // a query param named include_deleted in the spec
 * buildParamsRemap({ node }) // ['query: config.query ? { "include_deleted": config.query.includeDeleted } : config.query']
 * ```
 */
export function buildParamsRemap({ node }: { node: ast.OperationNode }): Array<string> {
  if (!ast.isHttpOperationNode(node)) return []

  const original = getOperationParameters(node, { paramsCasing: 'original' })
  const cased = getOperationParameters(node)

  const queryMapping = buildParamsMapping(original.query, cased.query)
  const headerMapping = buildParamsMapping(original.header, cased.header)

  const entries: Array<string> = []
  if (queryMapping) entries.push(`query: ${buildParamsRemapExpression({ source: 'config.query', mapping: queryMapping })}`)
  if (headerMapping) entries.push(`headers: ${buildParamsRemapExpression({ source: 'config.headers', mapping: headerMapping })}`)
  return entries
}
