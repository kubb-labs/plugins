import type { ast } from '@kubb/core'
import type { PluginVueQuery } from './types.ts'

export {
  buildGroupParam,
  buildMutationArgParams,
  buildQueryKeyParams,
  getComments,
  resolveErrorNames,
  resolveHeaderGroupType,
  resolvePathParamType,
  resolveQueryGroupType,
  resolveStatusCodeNames,
} from '@internals/tanstack-query'

export function transformName(name: string, type: string, transformers?: PluginVueQuery['resolvedOptions']['transformers']): string {
  return transformers?.name?.(name, type) || name
}

function matchesPattern(node: ast.OperationNode, ov: { type: string; pattern: string | RegExp }): boolean {
  const { type, pattern } = ov
  const matches = (value: string) => (typeof pattern === 'string' ? value === pattern : pattern.test(value))
  if (type === 'operationId') return matches(node.operationId)
  if (type === 'tag') return node.tags.some((t) => matches(t))
  if (type === 'path') return matches(node.path)
  if (type === 'method') return matches(node.method)
  return false
}

export function resolveOperationOverrides(
  node: ast.OperationNode,
  override?: PluginVueQuery['resolvedOptions']['override'],
): Partial<PluginVueQuery['resolvedOptions']> {
  if (!override) return {}
  const match = override.find((ov) => matchesPattern(node, ov as { type: string; pattern: string | RegExp }))
  return (match as { options?: Partial<PluginVueQuery['resolvedOptions']> })?.options ?? {}
}
