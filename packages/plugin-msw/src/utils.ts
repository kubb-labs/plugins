import type { ast } from '@kubb/core'
import type { ResolverFaker } from '@kubb/plugin-faker'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { PluginMsw } from './types.ts'

/**
 * Filters responses to only those with 2xx status codes.
 */
export function getSuccessResponses(node: ast.OperationNode): ast.ResponseNode[] {
  return node.responses.filter((response) => {
    const code = Number.parseInt(response.statusCode, 10)
    return !Number.isNaN(code) && code >= 200 && code < 300
  })
}

/**
 * Returns the first 2xx response for an operation, if any.
 */
export function getPrimarySuccessResponse(node: ast.OperationNode): ast.ResponseNode | undefined {
  return getSuccessResponses(node)[0]
}

/**
 * Gets the content type from a response, defaulting to 'application/json' if a schema exists.
 */
export function getContentType(response: ast.ResponseNode | undefined): string | undefined {
  return getResponseContentType(response) ?? (hasResponseSchema(response) ? 'application/json' : undefined)
}

/**
 * Determines if a response has a schema that is not void or any.
 */
export function hasResponseSchema(response: ast.ResponseNode | undefined): boolean {
  return !!getResponseContentType(response) || (!!response?.schema && response.schema.type !== 'void' && response.schema.type !== 'any')
}

function getResponseContentType(response: ast.ResponseNode | undefined): string | undefined {
  const contentType = response as unknown as { mediaType?: string | null; contentType?: string | null } | undefined
  const value = contentType?.mediaType ?? contentType?.contentType
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * Maps all operation responses to their type names, including status code or 'default' for default responses.
 */
export function getResponseTypes(node: ast.OperationNode, tsResolver: ResolverTs): Array<[statusCode: number | 'default', typeName: string]> {
  const types: Array<[number | 'default', string]> = []

  for (const response of node.responses) {
    if (response.statusCode === 'default') {
      types.push(['default', tsResolver.resolveResponseName(node)])
      continue
    }

    const code = Number.parseInt(response.statusCode, 10)
    if (Number.isNaN(code)) continue

    if (code >= 200 && code < 300) {
      types.push([code, tsResolver.resolveResponseName(node)])
      continue
    }

    types.push([code, tsResolver.resolveResponseStatusName(node, response.statusCode)])
  }

  return types
}

/**
 * Converts an HTTP method to its lowercase MSW equivalent (e.g., 'POST' → 'post').
 */
export function getMswMethod(node: ast.OperationNode): string {
  return node.method.toLowerCase()
}

/**
 * Converts an OpenAPI-style path to an Express/MSW-style path by replacing `{param}` with `:param`.
 */
export function getMswUrl(node: ast.OperationNode): string {
  return node.path.replaceAll('{', ':').replaceAll('}', '')
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
    file: fakerResolver.resolveFile({ name: node.operationId, extname: '.ts', tag, path: node.path }, { root, output: fakerOutput, group: fakerGroup }),
  }
}
