import { buildParamsMapping, getOperationParameters } from '@internals/shared'
import { isValidVarName } from '@internals/utils'
import { ast } from 'kubb/kit'

function toAccess(object: string, name: string): string {
  return isValidVarName(name) ? `${object}.${name}` : `${object}[${JSON.stringify(name)}]`
}

function toRemapEntry(group: 'query' | 'headers', mapping: Record<string, string>): string {
  const source = `config.${group}`
  const pairs = Object.entries(mapping)
    .map(([originalName, casedName]) => `${JSON.stringify(originalName)}: ${toAccess(source, casedName)}`)
    .join(', ')

  return `${group}: ${source} ? { ${pairs} } : ${source}`
}

/**
 * Builds the call-config entries that rename the camelCased `query` and `headers` keys back to the
 * names the OpenAPI document declares, so the wire format follows the spec while the generated
 * types keep camelCase keys. Returns an empty array when no name changes. Path parameters need no
 * remap because the URL template placeholders are renamed in sync with the `path` keys.
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

  return [queryMapping ? toRemapEntry('query', queryMapping) : null, headerMapping ? toRemapEntry('headers', headerMapping) : null].filter(
    (entry): entry is string => Boolean(entry),
  )
}
