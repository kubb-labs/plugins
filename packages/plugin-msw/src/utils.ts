import type { ast } from '@kubb/core'
import type { ResolverFaker } from '@kubb/plugin-faker'
import type { PluginMsw } from './types.ts'

/**
 * Gets the content type from a response, defaulting to 'application/json' if a schema exists.
 */
export function getContentType(response: ast.ResponseNode | null | undefined): string | null {
  if (!hasResponseSchema(response)) {
    return null
  }

  return getResponseContentType(response) ?? 'application/json'
}

/**
 * Determines if a response has a schema that is not void or any.
 */
export function hasResponseSchema(response: ast.ResponseNode | null | undefined): boolean {
  const schema = response?.content?.[0]?.schema
  return !!schema && schema.type !== 'void' && schema.type !== 'any'
}

function getResponseContentType(response: ast.ResponseNode | null | undefined): string | null {
  const value = response?.content?.[0]?.contentType
  return typeof value === 'string' && value.length > 0 ? value : null
}

/**
 * Converts an HTTP method to its lowercase MSW equivalent (e.g., 'POST' → 'post').
 */
export function getMswMethod(node: ast.OperationNode): string {
  return node.method!.toLowerCase()
}

/**
 * Converts an OpenAPI-style path to an Express/MSW-style path by replacing `{param}` with `:param`.
 */
export function getMswUrl(node: ast.OperationNode): string {
  return node.path!.replaceAll('{', ':').replaceAll('}', '')
}

/**
 * Resolves faker metadata for an MSW operation, including response name and file path.
 */
export function resolveFakerMeta(
  node: ast.OperationNode,
  options: {
    root: string
    fakerResolver: ResolverFaker
    fakerOutput: PluginMsw['resolvedOptions']['output']
    fakerGroup: PluginMsw['resolvedOptions']['group']
  },
): { name: string; file: { path: string } } {
  const { root, fakerResolver, fakerOutput, fakerGroup } = options
  const tag = node.tags[0] ?? 'default'

  return {
    name: fakerResolver.resolveResponseName(node),
    file: fakerResolver.resolveFile(
      { name: node.operationId, extname: '.ts', tag, path: node.path },
      { root, output: fakerOutput, group: fakerGroup ?? undefined },
    ),
  }
}
