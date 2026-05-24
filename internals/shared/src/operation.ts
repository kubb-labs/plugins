import { URLPath } from '@internals/utils'
import { ast } from '@kubb/core'

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

export type ResponseNameResolver = ResponseStatusNameResolver & {
  resolveResponseName(node: ast.OperationNode): string
}

export type OperationTypeNameResolver = RequestConfigResolver &
  ResponseNameResolver & {
    resolvePathParamsName(node: ast.OperationNode, param: ast.ParameterNode): string
    resolveQueryParamsName(node: ast.OperationNode, param: ast.ParameterNode): string
    resolveHeaderParamsName(node: ast.OperationNode, param: ast.ParameterNode): string
  }

export type OperationCommentLink = 'pathTemplate' | 'urlPath' | false | ((node: ast.OperationNode) => string | undefined)

export type BuildOperationCommentsOptions = {
  link?: OperationCommentLink
  linkPosition?: 'beforeDeprecated' | 'afterDeprecated'
  splitLines?: boolean
}

type ResponseLike = {
  statusCode: ast.StatusCode | number | string
}

export type OperationParameterGroups = Record<ast.ParameterNode['in'], Array<ast.ParameterNode>>

export type ResolveOperationTypeNameOptions = {
  paramsCasing?: 'camelcase'
  responseStatusNames?: boolean | 'error'
  exclude?: ReadonlyArray<string | undefined>
  order?: 'params-first' | 'body-response-first'
}

function getOperationLink(node: ast.OperationNode, link: OperationCommentLink): string | null {
  if (!link) {
    return null
  }

  if (typeof link === 'function') {
    return link(node) ?? null
  }

  if (link === 'urlPath') {
    return node.path ? `{@link ${new URLPath(node.path).URL}}` : null
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

export type ResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'

/**
 * Derives the default `responseType` for an operation from its primary success response.
 *
 * Returns a value only when that response declares a single non-JSON content type — a binary type
 * (`application/octet-stream`, `application/pdf`, `image/*`, `audio/*`, `video/*`) maps to `'blob'`
 * and other `text/*` maps to `'text'`. Otherwise `undefined`, leaving the runtime client's
 * `Content-Type` auto-detection in charge.
 */
export function getResponseType(node: ast.OperationNode): ResponseType | undefined {
  const contentTypes = getPrimarySuccessResponse(node)?.content?.map((entry) => entry.contentType) ?? []
  if (contentTypes.length !== 1) return undefined

  const baseType = contentTypes[0]!.split(';')[0]!.trim().toLowerCase()
  if (baseType === 'application/json' || baseType.endsWith('+json') || baseType === 'text/json') return undefined
  if (baseType.startsWith('text/')) return 'text'
  if (baseType === 'application/octet-stream' || baseType === 'application/pdf' || /^(image|audio|video)\//.test(baseType)) return 'blob'
  return undefined
}

export function buildRequestConfigType(node: ast.OperationNode, resolver: RequestConfigResolver): string {
  const requestName = node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : null
  const { isMultipleContentTypes, contentTypeUnion } = getContentTypeInfo(node)
  const configType = requestName ? `Partial<RequestConfig<${requestName}>>` : 'Partial<RequestConfig>'
  const configProps = ['client?: Client', isMultipleContentTypes ? `contentType?: ${contentTypeUnion}` : null].filter(Boolean).join('; ')

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

export function getOperationParameters(node: ast.OperationNode, options: { paramsCasing?: 'camelcase' } = {}): OperationParameterGroups {
  const params = ast.caseParams(node.parameters, options.paramsCasing)

  return {
    path: params.filter((param) => param.in === 'path'),
    query: params.filter((param) => param.in === 'query'),
    header: params.filter((param) => param.in === 'header'),
    cookie: params.filter((param) => param.in === 'cookie'),
  }
}

export function getStatusCodeNumber(statusCode: ast.StatusCode | number | string): number | null {
  const code = Number(statusCode)

  return Number.isNaN(code) ? null : code
}

export function isSuccessStatusCode(statusCode: ast.StatusCode | number | string): boolean {
  const code = getStatusCodeNumber(statusCode)

  return code !== null && code >= 200 && code < 300
}

export function isErrorStatusCode(statusCode: ast.StatusCode | number | string): boolean {
  const code = getStatusCodeNumber(statusCode)

  return code !== null && code >= 400
}

export function getSuccessResponses<TResponse extends ResponseLike>(responses: ReadonlyArray<TResponse>): Array<TResponse> {
  return responses.filter((response) => isSuccessStatusCode(response.statusCode))
}

export function getOperationSuccessResponses(node: ast.OperationNode): Array<ast.ResponseNode> {
  return getSuccessResponses(node.responses)
}

export function getPrimarySuccessResponse(node: ast.OperationNode): ast.ResponseNode | null {
  return getOperationSuccessResponses(node)[0] ?? null
}

export function resolveErrorNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): string[] {
  return node.responses
    .filter((response) => isErrorStatusCode(response.statusCode))
    .map((response) => resolver.resolveResponseStatusName(node, response.statusCode))
}

export function resolveSuccessNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): string[] {
  return node.responses
    .filter((response) => isSuccessStatusCode(response.statusCode))
    .map((response) => resolver.resolveResponseStatusName(node, response.statusCode))
}

export function resolveStatusCodeNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): string[] {
  return node.responses.map((response) => resolver.resolveResponseStatusName(node, response.statusCode))
}

const typeNamesByResolver = new WeakMap<OperationTypeNameResolver, Map<string, string[]>>()

export function resolveOperationTypeNames(
  node: ast.OperationNode,
  resolver: OperationTypeNameResolver,
  options: ResolveOperationTypeNameOptions = {},
): string[] {
  const cacheKey = `${node.operationId}\0${options.paramsCasing ?? ''}\0${options.order ?? ''}\0${options.responseStatusNames ?? ''}\0${(options.exclude ?? []).join(',')}`
  let byResolver = typeNamesByResolver.get(resolver)
  if (byResolver) {
    const cached = byResolver.get(cacheKey)
    if (cached) return cached
  } else {
    byResolver = new Map()
    typeNamesByResolver.set(resolver, byResolver)
  }

  const { path, query, header } = getOperationParameters(node, { paramsCasing: options.paramsCasing })
  const responseStatusNames =
    options.responseStatusNames === 'error'
      ? resolveErrorNames(node, resolver)
      : options.responseStatusNames === false
        ? []
        : resolveStatusCodeNames(node, resolver)
  const exclude = new Set(options.exclude ?? [])
  const paramNames = [
    ...path.map((param) => resolver.resolvePathParamsName(node, param)),
    ...query.map((param) => resolver.resolveQueryParamsName(node, param)),
    ...header.map((param) => resolver.resolveHeaderParamsName(node, param)),
  ]
  const bodyAndResponseNames = [node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : null, resolver.resolveResponseName(node)]
  const names =
    options.order === 'body-response-first'
      ? [...bodyAndResponseNames, ...paramNames, ...responseStatusNames]
      : [...paramNames, ...bodyAndResponseNames, ...responseStatusNames]

  const result = names.filter((name): name is string => Boolean(name) && !exclude.has(name as string))
  byResolver.set(cacheKey, result)
  return result
}

export function resolveResponseTypes(node: ast.OperationNode, resolver: ResponseNameResolver): Array<[statusCode: number | 'default', typeName: string]> {
  const types: Array<[number | 'default', string]> = []

  for (const response of node.responses) {
    if (response.statusCode === 'default') {
      types.push(['default', resolver.resolveResponseName(node)])
      continue
    }

    const code = getStatusCodeNumber(response.statusCode)
    if (code === null) {
      continue
    }

    types.push([code, isSuccessStatusCode(code) ? resolver.resolveResponseName(node) : resolver.resolveResponseStatusName(node, response.statusCode)])
  }

  return types
}

export function findSuccessStatusCode(responses: Array<{ statusCode: ast.StatusCode | number | string }>): ast.StatusCode | null {
  for (const response of responses) {
    if (isSuccessStatusCode(response.statusCode)) {
      return response.statusCode as ast.StatusCode
    }
  }

  return null
}
