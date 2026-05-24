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

export type TypeNameResolver = {
  resolveTypeName(name: string): string
}

export type ResponseStatusNameResolver = {
  resolveResponseStatusName(node: ast.OperationNode, statusCode: ast.StatusCode): string
}

export type ResponseNameResolver = ResponseStatusNameResolver & {
  resolveResponseName(node: ast.OperationNode): string
}

export type OperationTypeNameResolver = RequestConfigResolver &
  ResponseNameResolver &
  TypeNameResolver & {
    resolvePathParamsName(node: ast.OperationNode, param: ast.ParameterNode): string
    resolveQueryParamsName(node: ast.OperationNode, param: ast.ParameterNode): string
    resolveHeaderParamsName(node: ast.OperationNode, param: ast.ParameterNode): string
  }

export type OperationTypesOptions = {
  /**
   * When `false`, a response or request body backed by a single `$ref` resolves to the
   * referenced component type (e.g. `Pet`) instead of the per-operation alias
   * (`AddPetStatus200`, `AddPetData`). Inline, array, and union schemas keep the alias
   * because no single base type exists.
   *
   * @default false
   */
  operationTypes?: boolean
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

export type ResolveOperationTypeNameOptions = OperationTypesOptions & {
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

type InlinableContent = { schema?: ast.SchemaNode | null; keysToOmit?: ReadonlyArray<string> | null } | null | undefined

/**
 * Returns the referenced component name when a content entry can be inlined to its base type,
 * or `null` when it cannot. Inlining is only safe for a bare `$ref`: a `keysToOmit` turns the
 * type into `Omit<Base, ...>`, so the per-operation alias must be kept instead.
 */
export function resolveInlinableRefName(content: InlinableContent): string | null {
  if (!content?.schema || content.keysToOmit?.length) {
    return null
  }

  return ast.resolveRefName(content.schema) ?? null
}

export type ResolveResponseTypeNameOptions = OperationTypesOptions & {
  node: ast.OperationNode
  response: ast.ResponseNode
  resolver: ResponseStatusNameResolver & TypeNameResolver
}

/**
 * Resolves the type name for a single response status.
 *
 * With `operationTypes: false`, a response whose schema is a single `$ref` resolves to the
 * referenced component type (e.g. `Pet`); otherwise it falls back to the per-operation alias.
 */
export function resolveResponseTypeName({ node, response, resolver, operationTypes = true }: ResolveResponseTypeNameOptions): string {
  if (!operationTypes) {
    const refName = resolveInlinableRefName(response.content?.[0])
    if (refName) {
      return resolver.resolveTypeName(refName)
    }
  }

  return resolver.resolveResponseStatusName(node, response.statusCode)
}

export type ResolveRequestTypeNameOptions = OperationTypesOptions & {
  node: ast.OperationNode
  resolver: RequestConfigResolver & TypeNameResolver
}

/**
 * Resolves the request body type name, or `null` when the operation has no body.
 *
 * With `operationTypes: false`, a body with a single content type backed by a single `$ref`
 * resolves to the referenced component type (e.g. `Pet`); otherwise it falls back to the
 * `XxxData` alias. Multiple content types keep the alias because the body is a union of
 * per-content-type variants, so no single base type exists.
 */
export function resolveRequestTypeName({ node, resolver, operationTypes = true }: ResolveRequestTypeNameOptions): string | null {
  const contents = node.requestBody?.content ?? []
  if (!contents[0]?.schema) {
    return null
  }

  if (!operationTypes && contents.length === 1) {
    const refName = resolveInlinableRefName(contents[0])
    if (refName) {
      return resolver.resolveTypeName(refName)
    }
  }

  return resolver.resolveDataName(node)
}

/**
 * Wraps a resolver so response and request body names resolve to the inlined base type for a
 * single `$ref` when `operationTypes` is false. Apply it once per operation so every downstream
 * consumer — `resolveSuccessNames`, `buildRequestConfigType`, `ast.createOperationParams` — sees
 * the inlining decision without threading the flag through each call.
 *
 * Returns the resolver unchanged when `operationTypes` is not false.
 */
export function inlineOperationResolver<T extends RequestConfigResolver & ResponseStatusNameResolver & TypeNameResolver>(
  resolver: T,
  operationTypes: boolean | undefined,
): T {
  if (operationTypes !== false) {
    return resolver
  }

  return {
    ...resolver,
    resolveDataName(node: ast.OperationNode): string {
      return resolveRequestTypeName({ node, resolver, operationTypes }) ?? resolver.resolveDataName(node)
    },
    resolveResponseStatusName(node: ast.OperationNode, statusCode: ast.StatusCode): string {
      const response = node.responses.find((res) => String(res.statusCode) === String(statusCode))
      return response ? resolveResponseTypeName({ node, response, resolver, operationTypes }) : resolver.resolveResponseStatusName(node, statusCode)
    },
  }
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

/**
 * A type name needed by an operation, paired with the schema it originates from.
 *
 * `schemaName` is `null` for operation-local types (params, `RequestConfig`, the response
 * union, and aliases for inline schemas), which live in the operation's own generated file.
 * When `operationTypes: false` inlines a `$ref`, `schemaName` holds the referenced component
 * name so the consumer can import it from that component's file instead.
 */
export type OperationTypeImport = {
  name: string
  schemaName: string | null
}

export function resolveOperationTypeImports(
  node: ast.OperationNode,
  resolver: OperationTypeNameResolver,
  options: ResolveOperationTypeNameOptions = {},
): OperationTypeImport[] {
  const { operationTypes } = options
  const { path, query, header } = getOperationParameters(node, { paramsCasing: options.paramsCasing })

  const local = (name: string | null): OperationTypeImport | null => (name ? { name, schemaName: null } : null)

  const paramImports: Array<OperationTypeImport | null> = [
    ...path.map((param) => local(resolver.resolvePathParamsName(node, param))),
    ...query.map((param) => local(resolver.resolveQueryParamsName(node, param))),
    ...header.map((param) => local(resolver.resolveHeaderParamsName(node, param))),
  ]

  const requestImport: OperationTypeImport | null = node.requestBody?.content?.[0]?.schema
    ? (() => {
        const contents = node.requestBody!.content!
        if (operationTypes === false && contents.length === 1) {
          const refName = resolveInlinableRefName(contents[0])
          if (refName) {
            return { name: resolver.resolveTypeName(refName), schemaName: refName }
          }
        }
        return { name: resolver.resolveDataName(node), schemaName: null }
      })()
    : null

  const bodyAndResponseImports: Array<OperationTypeImport | null> = [requestImport, local(resolver.resolveResponseName(node))]

  const responseImports: Array<OperationTypeImport | null> =
    options.responseStatusNames === false
      ? []
      : (options.responseStatusNames === 'error' ? node.responses.filter((response) => isErrorStatusCode(response.statusCode)) : node.responses).map(
          (response) => {
            if (operationTypes === false) {
              const refName = resolveInlinableRefName(response.content?.[0])
              if (refName) {
                return { name: resolver.resolveTypeName(refName), schemaName: refName }
              }
            }
            return { name: resolver.resolveResponseStatusName(node, response.statusCode), schemaName: null }
          },
        )

  const ordered =
    options.order === 'body-response-first'
      ? [...bodyAndResponseImports, ...paramImports, ...responseImports]
      : [...paramImports, ...bodyAndResponseImports, ...responseImports]

  const exclude = new Set(options.exclude ?? [])
  return ordered.filter((imp): imp is OperationTypeImport => Boolean(imp) && !exclude.has(imp!.name))
}

export type OperationTypeImportGroup = {
  path: string
  names: string[]
}

/**
 * Groups operation type imports by source file.
 *
 * Operation-local names map to `operationFilePath`; inlined base components map to the file
 * returned by `resolveSchemaFilePath`. Names are de-duplicated per file.
 */
export function groupOperationTypeImports(
  imports: OperationTypeImport[],
  operationFilePath: string,
  resolveSchemaFilePath: (schemaName: string) => string,
): OperationTypeImportGroup[] {
  const byPath = new Map<string, Set<string>>()

  for (const imp of imports) {
    const filePath = imp.schemaName ? resolveSchemaFilePath(imp.schemaName) : operationFilePath
    const names = byPath.get(filePath) ?? new Set<string>()
    names.add(imp.name)
    byPath.set(filePath, names)
  }

  return Array.from(byPath, ([path, names]) => ({ path, names: Array.from(names) }))
}

const typeNamesByResolver = new WeakMap<OperationTypeNameResolver, Map<string, string[]>>()

export function resolveOperationTypeNames(
  node: ast.OperationNode,
  resolver: OperationTypeNameResolver,
  options: ResolveOperationTypeNameOptions = {},
): string[] {
  const cacheKey = `${node.operationId}\0${options.paramsCasing ?? ''}\0${options.order ?? ''}\0${options.responseStatusNames ?? ''}\0${options.operationTypes === false ? '0' : '1'}\0${(options.exclude ?? []).join(',')}`
  let byResolver = typeNamesByResolver.get(resolver)
  if (byResolver) {
    const cached = byResolver.get(cacheKey)
    if (cached) return cached
  } else {
    byResolver = new Map()
    typeNamesByResolver.set(resolver, byResolver)
  }

  const result = resolveOperationTypeImports(node, resolver, options).map((imp) => imp.name)
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
