import { URLPath } from '@internals/utils'
import type { ast } from '@kubb/core'

export type ContentTypeInfo = {
  contentTypes: string[]
  isMultipleContentTypes: boolean
  contentTypeUnion: string
  defaultContentType: string
  hasFormData: boolean
}

export type RequestConfigResolver = {
  resolveDataName(node: ast.OperationNode): string
}

export type ResponseStatusNameResolver = {
  resolveResponseStatusName(node: ast.OperationNode, statusCode: ast.StatusCode): string
}

export type OperationCommentLink = 'pathTemplate' | 'urlPath' | false | ((node: ast.OperationNode) => string | undefined)

export type BuildOperationCommentsOptions = {
  link?: OperationCommentLink
  linkPosition?: 'beforeDeprecated' | 'afterDeprecated'
  splitLines?: boolean
}

function getOperationLink(node: ast.OperationNode, link: OperationCommentLink): string | undefined {
  if (!link) {
    return undefined
  }

  if (typeof link === 'function') {
    return link(node)
  }

  if (link === 'urlPath') {
    return node.path ? `{@link ${new URLPath(node.path).URL}}` : undefined
  }

  return `{@link ${node.path.replaceAll('{', ':').replaceAll('}', '')}}`
}

export function getContentTypeInfo(node: ast.OperationNode): ContentTypeInfo {
  const contentTypes = node.requestBody?.content?.map((e) => e.contentType) ?? []
  const isMultipleContentTypes = contentTypes.length > 1

  return {
    contentTypes,
    isMultipleContentTypes,
    contentTypeUnion: isMultipleContentTypes ? contentTypes.map((ct) => JSON.stringify(ct)).join(' | ') : '',
    defaultContentType: contentTypes[0] ?? 'application/json',
    hasFormData: contentTypes.some((ct) => ct === 'multipart/form-data'),
  }
}

export function buildRequestConfigType(node: ast.OperationNode, resolver: RequestConfigResolver): string {
  const requestName = node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : undefined
  const { isMultipleContentTypes, contentTypeUnion } = getContentTypeInfo(node)
  const configType = requestName ? `Partial<RequestConfig<${requestName}>>` : 'Partial<RequestConfig>'
  const configProps = ['client?: Client', isMultipleContentTypes ? `contentType?: ${contentTypeUnion}` : undefined].filter(Boolean).join('; ')

  return `${configType} & { ${configProps} }`
}

export function buildOperationComments(node: ast.OperationNode, options: BuildOperationCommentsOptions = {}): Array<string> {
  const { link = 'pathTemplate', linkPosition = 'afterDeprecated', splitLines = false } = options
  const linkComment = getOperationLink(node, link)
  const comments =
    linkPosition === 'beforeDeprecated'
      ? [node.description && `@description ${node.description}`, node.summary && `@summary ${node.summary}`, linkComment, node.deprecated && '@deprecated']
      : [node.description && `@description ${node.description}`, node.summary && `@summary ${node.summary}`, node.deprecated && '@deprecated', linkComment]

  const filteredComments = comments.filter((comment): comment is string => Boolean(comment))

  if (!splitLines) {
    return filteredComments
  }

  return filteredComments.flatMap((text) => text.split(/\r?\n/).map((line) => line.trim())).filter((comment): comment is string => Boolean(comment))
}

export function resolveErrorNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): string[] {
  return node.responses
    .filter((response) => {
      const code = Number.parseInt(response.statusCode, 10)
      return code >= 400
    })
    .map((response) => resolver.resolveResponseStatusName(node, response.statusCode))
}

export function resolveStatusCodeNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): string[] {
  return node.responses.map((response) => resolver.resolveResponseStatusName(node, response.statusCode))
}

export function findSuccessStatusCode(responses: Array<{ statusCode: ast.StatusCode | number | string }>): ast.StatusCode | undefined {
  for (const response of responses) {
    const code = Number(response.statusCode)

    if (code >= 200 && code < 300) {
      return response.statusCode as ast.StatusCode
    }
  }

  return undefined
}
