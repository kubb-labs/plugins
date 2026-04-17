import type { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import type { PluginMsw } from './types.ts'

export function transformName(name: string, type: 'function' | 'type' | 'file' | 'const', transformers?: PluginMsw['resolvedOptions']['transformers']): string {
  return transformers?.name?.(name, type) || name
}

export function getSuccessResponses(node: ast.OperationNode): ast.ResponseNode[] {
  return node.responses.filter((response) => {
    const code = Number.parseInt(response.statusCode, 10)
    return !Number.isNaN(code) && code >= 200 && code < 300
  })
}

export function getPrimarySuccessResponse(node: ast.OperationNode): ast.ResponseNode | undefined {
  return getSuccessResponses(node)[0]
}

export function getContentType(response: ast.ResponseNode | undefined): string | undefined {
  return getResponseContentType(response) ?? (hasResponseSchema(response) ? 'application/json' : undefined)
}

export function hasResponseSchema(response: ast.ResponseNode | undefined): boolean {
  return !!getResponseContentType(response) || (!!response?.schema && response.schema.type !== 'void' && response.schema.type !== 'any')
}

function getResponseContentType(response: ast.ResponseNode | undefined): string | undefined {
  const contentType = response as unknown as { mediaType?: string | null; contentType?: string | null } | undefined
  const value = contentType?.mediaType ?? contentType?.contentType
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function getResponseTypes(node: ast.OperationNode, tsResolver: PluginTs['resolver']): Array<[statusCode: number | 'default', typeName: string]> {
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

export function getMswMethod(node: ast.OperationNode): string {
  return node.method.toLowerCase()
}

export function getMswUrl(node: ast.OperationNode): string {
  return node.path.replaceAll('{', ':').replaceAll('}', '')
}

export function resolveFakerMeta(
  node: ast.OperationNode,
  options: {
    root: string
    fakerResolver: {
      resolveResponseName(node: ast.OperationNode): string
      resolveFile(
        params: { name: string; extname: '.ts'; tag: string; path: string },
        options: { root: string; output: PluginMsw['resolvedOptions']['output']; group: PluginMsw['resolvedOptions']['group'] },
      ): { path: string }
    }
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
