import { ast, type ResolverFileParams, Url } from 'kubb/kit'
import { dedupeParams } from './params.ts'

/**
 * Builds the `ResolverFileParams` every operation generator passes to
 * `resolver.file`: a file named `name`, tagged by the operation's first
 * tag (or `'default'`), at the operation's path. Centralizes the entry object
 * that was repeated at dozens of call sites across the client and query plugins.
 *
 * @example
 * ```ts
 * resolver.file(operationFileEntry(node, node.operationId), { root, output, group })
 * ```
 */
export function operationFileEntry(node: ast.OperationNode, name: string, extname: ResolverFileParams['extname'] = '.ts'): ResolverFileParams {
  return {
    name,
    extname,
    tag: node.tags[0] ?? 'default',
    path: node.path,
  }
}

export type ContentTypeInfo = {
  contentTypes: string[]
  isMultipleContentTypes: boolean
  contentTypeUnion: string
  defaultContentType: string
  hasFormData: boolean
}

export type RequestConfigResolver = {
  response: {
    body(node: ast.OperationNode): string
  }
}

export type ResponseStatusNameResolver = {
  response: {
    status(node: ast.OperationNode, statusCode: ast.StatusCode): string
  }
}

export type ResponseNameResolver = ResponseStatusNameResolver & {
  response: {
    response(node: ast.OperationNode): string
  }
}

export type OperationTypeNameResolver = RequestConfigResolver &
  ResponseNameResolver & {
    param: {
      path(node: ast.OperationNode, param: ast.ParameterNode): string
      query(node: ast.OperationNode, param: ast.ParameterNode): string
      headers(node: ast.OperationNode, param: ast.ParameterNode): string
    }
  }

/**
 * Resolver interface for building operation parameters.
 *
 * `ResolverTs` from `@kubb/plugin-ts` satisfies this interface and can be passed directly.
 */
export type OperationParamsResolver = {
  /**
   * Naming for an operation's parameters, grouped by location.
   */
  param: {
    /**
     * Resolves the type name for an individual parameter.
     *
     * @example Individual path parameter name
     * `resolver.param.name(node, param) // → 'DeletePetPathPetId'`
     */
    name(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the grouped path parameters type name.
     * When the return value equals `resolver.param.name`, no indexed access is emitted.
     *
     * @example Grouped path params type name
     * `resolver.param.path(node, param) // → 'DeletePetPath'`
     */
    path(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the grouped query parameters type name.
     * When the return value equals `resolver.param.name`, an inline struct type is emitted instead.
     *
     * @example Grouped query params type name
     * `resolver.param.query(node, param) // → 'FindPetsByStatusQuery'`
     */
    query(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the grouped header parameters type name.
     * When the return value equals `resolver.param.name`, an inline struct type is emitted instead.
     *
     * @example Grouped header params type name
     * `resolver.param.headers(node, param) // → 'DeletePetHeaders'`
     */
    headers(node: ast.OperationNode, param: ast.ParameterNode): string
  }
  /**
   * Naming for an operation's request and response types.
   */
  response: {
    /**
     * Resolves the request body type name.
     *
     * @example Request body type name
     * `resolver.response.body(node) // → 'CreatePetBody'`
     */
    body(node: ast.OperationNode): string
  }
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
  responseStatusNames?: boolean | 'error'
  exclude?: ReadonlyArray<string | undefined>
  order?: 'params-first' | 'body-response-first'
  /**
   * Include the individual `Path`/`Query`/`Headers` group type names. Set to `false` for clients
   * that reference the grouped `Options` type instead of the per-group types.
   */
  includeParams?: boolean
}

function getOperationLink(node: ast.OperationNode, link: OperationCommentLink): string | null {
  if (!link) {
    return null
  }

  if (typeof link === 'function') {
    return link(node) ?? null
  }

  return node.path ? `{@link ${Url.toPath(node.path)}}` : null
}

/**
 * Derives the shared `ContentTypeInfo` shape from a list of content types, tracking whether several
 * are present and the union, default, and form-data flags the client uses to pick one.
 */
function buildContentTypeInfo(contentTypes: string[]): ContentTypeInfo {
  const isMultipleContentTypes = contentTypes.length > 1

  return {
    contentTypes,
    isMultipleContentTypes,
    contentTypeUnion: isMultipleContentTypes ? contentTypes.map((ct) => JSON.stringify(ct)).join(' | ') : '',
    defaultContentType: contentTypes[0] ?? 'application/json',
    hasFormData: contentTypes.some((ct) => ct === 'multipart/form-data'),
  }
}

export function getContentTypeInfo(node: ast.OperationNode): ContentTypeInfo {
  return buildContentTypeInfo(node.requestBody?.content?.map((e) => e.contentType) ?? [])
}

/**
 * The request-body counterpart for the primary success response: the content types it documents and
 * whether several are present, so the client can let a caller pick which one to accept.
 */
export function getResponseContentTypeInfo(node: ast.OperationNode): ContentTypeInfo {
  return buildContentTypeInfo(getPrimarySuccessResponse(node)?.content?.map((e) => e.contentType) ?? [])
}

export type ResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'

/**
 * Reads the single base content type of an operation's primary success response, lowercased and
 * stripped of any `; charset=...` suffix. Returns `undefined` when the response declares zero or
 * more than one content type, since neither case has a single type to act on.
 */
function getPrimarySuccessContentType(node: ast.OperationNode): string | undefined {
  const contentTypes = getPrimarySuccessResponse(node)?.content?.map((entry) => entry.contentType) ?? []
  if (contentTypes.length !== 1) return undefined
  return contentTypes[0]!.split(';')[0]!.trim().toLowerCase()
}

/**
 * Whether an operation streams its primary success response as Server-Sent Events
 * (`text/event-stream`). The client generator uses this to return a typed event stream instead of a
 * one-shot `RequestResult`.
 */
export function isEventStream(node: ast.OperationNode): boolean {
  return getPrimarySuccessContentType(node) === 'text/event-stream'
}

/**
 * Derives the default `responseType` for an operation from its primary success response.
 *
 * Returns a value only when that response declares a single non-JSON content type. `text/event-stream`
 * and other binary types (`application/octet-stream`, `application/pdf`, `image/*`, `audio/*`,
 * `video/*`) map to a stream or `'blob'`, and other `text/*` maps to `'text'`. Otherwise `undefined`,
 * leaving the runtime client's `Content-Type` auto-detection in charge.
 */
export function getResponseType(node: ast.OperationNode): ResponseType | undefined {
  const baseType = getPrimarySuccessContentType(node)
  if (!baseType) return undefined

  if (baseType === 'application/json' || baseType.endsWith('+json') || baseType === 'text/json') return undefined
  if (baseType === 'text/event-stream') return 'stream'
  if (baseType.startsWith('text/')) return 'text'
  if (baseType === 'application/octet-stream' || baseType === 'application/pdf' || /^(image|audio|video)\//.test(baseType)) return 'blob'
  return undefined
}

/**
 * Maps a content type to the PascalCase suffix used to name per-content-type variants
 * (e.g. `application/json` → `Json`, `application/xml` → `Xml`, `multipart/form-data` → `FormData`).
 */
function getContentTypeSuffix(contentType: string): string {
  const baseType = contentType.split(';')[0]!.trim()
  if (baseType === 'application/json') return 'Json'
  if (baseType === 'multipart/form-data') return 'FormData'
  if (baseType === 'application/x-www-form-urlencoded') return 'FormUrlEncoded'
  const subtype = baseType.split('/').pop() ?? baseType
  const parts = subtype.split(/[^a-zA-Z0-9]+/).filter(Boolean)
  if (parts.length === 0) return 'Unknown'
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('')
}

/**
 * Appends a content-type suffix to a base name, keeping a trailing `Data` segment last
 * (e.g. `AddPetData` + `Json` → `AddPetJsonData`, `AddPetStatus200` + `Xml` → `AddPetStatus200Xml`).
 */
export function getPerContentTypeName(baseName: string, suffix: string): string {
  if (baseName.endsWith('Data')) {
    return suffix.endsWith('Data') ? baseName.slice(0, -4) + suffix : `${baseName.slice(0, -4)}${suffix}Data`
  }
  return baseName + suffix
}

export type ContentVariantInput = { contentType: string; schema?: ast.SchemaNode | null; keysToOmit?: Array<string> | null }
export type ContentVariant = { name: string; suffix: string; schema: ast.SchemaNode; keysToOmit?: Array<string> | null; contentType: string }

/**
 * Resolves per-content-type variant names for a set of content entries, deduplicating suffix
 * collisions with a numeric counter. Entries without a schema are skipped. The returned `suffix` is
 * the final (possibly counter-augmented) value, so callers can derive parallel names in another
 * namespace (e.g. plugin-faker deriving the matching plugin-ts type name).
 */
export function resolveContentTypeVariants(entries: Array<ContentVariantInput>, baseName: string): Array<ContentVariant> {
  const usedNames = new Set<string>()
  return entries
    .filter((entry) => entry.schema)
    .map((entry) => {
      const baseSuffix = getContentTypeSuffix(entry.contentType)
      let suffix = baseSuffix
      let name = getPerContentTypeName(baseName, suffix)
      let counter = 2
      while (usedNames.has(name)) {
        suffix = `${baseSuffix}${counter++}`
        name = getPerContentTypeName(baseName, suffix)
      }
      usedNames.add(name)
      return { name, suffix, schema: entry.schema!, keysToOmit: entry.keysToOmit, contentType: entry.contentType }
    })
}

export function buildRequestConfigType(node: ast.OperationNode): string {
  const request = getContentTypeInfo(node)
  const response = getResponseContentTypeInfo(node)
  // The request groups come from the grouped params, so `config` drops the data-shape keys to stay
  // assignable to `Options`, which omits them from `RequestConfig`.
  const configType = `Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>`

  // Only the ambiguous side is offered: a single-type side has nothing to pick, so it stays baked in
  // the generated call.
  const members = [
    request.isMultipleContentTypes ? `request?: ${request.contentTypeUnion}` : null,
    response.isMultipleContentTypes ? `response?: ${response.contentTypeUnion}` : null,
  ].filter(Boolean)

  return members.length ? `${configType} & { contentType?: { ${members.join('; ')} } }` : configType
}

/**
 * Builds the `client?:` option type shared by the generated query hooks (`useQuery`,
 * `useInfiniteQuery`, `useSWR`, ...). Unlike {@link buildRequestConfigType}, it never adds a
 * `contentType?:` member: query hooks wrap GET operations, which carry no request body to select a
 * content type for.
 */
export function buildClientOptionType(): string {
  return `Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>`
}

export type RequestGroups = {
  path: boolean
  query: boolean
  body: boolean
  headers: boolean
}

/**
 * Which of the grouped request options an operation carries.
 */
export function getRequestGroups(node: ast.OperationNode): RequestGroups {
  const { path, query, header } = getOperationParameters(node)
  return {
    path: path.length > 0,
    query: query.length > 0,
    body: Boolean(node.requestBody?.content?.[0]?.schema),
    headers: header.length > 0,
  }
}

export type RequestGroupOptionality = {
  groups: RequestGroups
  hasRequiredPath: boolean
  hasRequiredQuery: boolean
  hasRequiredHeader: boolean
  /**
   * Whether the grouped request parameter can default to `{}`. True only when no group carries a
   * required member, so every member is safe to omit.
   */
  isOptional: boolean
}

/**
 * Resolves which grouped request options an operation carries together with whether each group
 * holds a required member. The grouped parameter stays optional only when nothing inside it is
 * required, matching the generated `RequestConfig` type.
 */
export function getRequestGroupOptionality(node: ast.OperationNode): RequestGroupOptionality {
  const groups = getRequestGroups(node)
  const { path, query, header } = getOperationParameters(node)
  const hasRequiredPath = path.some((param) => param.required)
  const hasRequiredQuery = query.some((param) => param.required)
  const hasRequiredHeader = header.some((param) => param.required)

  return {
    groups,
    hasRequiredPath,
    hasRequiredQuery,
    hasRequiredHeader,
    isOptional: !hasRequiredPath && !hasRequiredQuery && !hasRequiredHeader && !groups.body,
  }
}

export type RequestOptionsNameResolver = RequestConfigResolver & {
  response: {
    options(node: ast.OperationNode): string
  }
}

/**
 * Builds the grouped `{ path, query, body, headers }` parameter for a generated client
 * function, typed from the operation's `Options` (minus `url`). Only the groups the
 * operation actually has are destructured. The trailing `config` parameter carries the
 * runtime `RequestConfig` overrides plus `client`.
 */
export function buildRequestParamsSignature(
  node: ast.OperationNode,
  resolver: RequestOptionsNameResolver,
  options: { isConfigurable?: boolean } = {},
): { signature: string; groups: RequestGroups } {
  const { isConfigurable = true } = options
  const { groups, isOptional } = getRequestGroupOptionality(node)

  const names = (['path', 'query', 'body', 'headers'] as const).filter((key) => groups[key])

  const firstParam = names.length > 0 ? `{ ${names.join(', ')} }: ${resolver.response.options(node)}${isOptional ? ' = {}' : ''}` : null
  const configParam = isConfigurable ? `config: ${buildRequestConfigType(node)} = {}` : null

  return {
    signature: [firstParam, configParam].filter(Boolean).join(', '),
    groups,
  }
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

export function getOperationParameters(node: ast.OperationNode): OperationParameterGroups {
  return {
    path: dedupeParams(node.parameters.filter((param) => param.in === 'path')),
    query: dedupeParams(node.parameters.filter((param) => param.in === 'query')),
    header: dedupeParams(node.parameters.filter((param) => param.in === 'header')),
    cookie: dedupeParams(node.parameters.filter((param) => param.in === 'cookie')),
  }
}

/**
 * Builds the combined `{ body, path, query, headers }` options object schema for an operation,
 * referencing the already-resolved body and grouped param names. Shared by `@kubb/plugin-ts`'s
 * `Options` type and `@kubb/plugin-zod`'s inferred options schema, so both printers emit the same
 * shape from the same inputs. `primitive: 'object'` is a no-op for the TS printer and tells the Zod
 * printer to emit `z.object(…)` rather than a record.
 */
export function buildOptionsSchema(node: ast.OperationNode, resolver: OperationTypeNameResolver): ast.SchemaNode {
  const { path, query, header } = getOperationParameters(node)
  const hasBody = Boolean(node.requestBody?.content?.[0]?.schema)
  const createNever = () => ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true })
  const groups = [
    { name: 'path', params: path, resolve: resolver.param.path },
    { name: 'query', params: query, resolve: resolver.param.query },
    { name: 'headers', params: header, resolve: resolver.param.headers },
  ] as const

  // NOTE(v5-stable): the fields were renamed from the legacy beta shape
  // (`data`/`pathParams`/`queryParams`/`headerParams`) to `body`/`path`/`query`/`headers` so the
  // type matches the runtime client. Drop this note once v5 leaves beta.
  return ast.factory.createSchema({
    type: 'object',
    primitive: 'object',
    deprecated: node.deprecated,
    properties: [
      ast.factory.createProperty({
        name: 'body',
        required: hasBody,
        schema: hasBody ? ast.factory.createSchema({ type: 'ref', name: resolver.response.body(node) }) : createNever(),
      }),
      ...groups.map(({ name, params, resolve }) => {
        const required = params.some((param) => param.required)

        return ast.factory.createProperty({
          name,
          required,
          schema:
            params.length > 0
              ? ast.factory.createSchema({ type: 'ref', name: resolve.call(resolver.param, node, params[0]!), optional: !required })
              : createNever(),
        })
      }),
    ],
  })
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
  return node.responses.filter((response) => isErrorStatusCode(response.statusCode)).map((response) => resolver.response.status(node, response.statusCode))
}

export function resolveSuccessNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): string[] {
  return node.responses.filter((response) => isSuccessStatusCode(response.statusCode)).map((response) => resolver.response.status(node, response.statusCode))
}

export function resolveStatusCodeNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): string[] {
  return node.responses.map((response) => resolver.response.status(node, response.statusCode))
}

const typeNamesByResolver = new WeakMap<OperationTypeNameResolver, Map<string, string[]>>()

export function resolveOperationTypeNames(
  node: ast.OperationNode,
  resolver: OperationTypeNameResolver,
  options: ResolveOperationTypeNameOptions = {},
): string[] {
  const cacheKey = `${node.operationId}\0${options.order ?? ''}\0${options.responseStatusNames ?? ''}\0${options.includeParams === false ? 'noparams' : ''}\0${(options.exclude ?? []).join(',')}`
  let byResolver = typeNamesByResolver.get(resolver)
  if (byResolver) {
    const cached = byResolver.get(cacheKey)
    if (cached) return cached
  } else {
    byResolver = new Map()
    typeNamesByResolver.set(resolver, byResolver)
  }

  const { path, query, header } = getOperationParameters(node)
  const responseStatusNames =
    options.responseStatusNames === 'error'
      ? resolveErrorNames(node, resolver)
      : options.responseStatusNames === false
        ? []
        : resolveStatusCodeNames(node, resolver)
  const exclude = new Set(options.exclude ?? [])
  const paramNames =
    options.includeParams === false
      ? []
      : [
          ...path.map((param) => resolver.param.path(node, param)),
          ...query.map((param) => resolver.param.query(node, param)),
          ...header.map((param) => resolver.param.headers(node, param)),
        ]
  const bodyAndResponseNames = [node.requestBody?.content?.[0]?.schema ? resolver.response.body(node) : null, resolver.response.response(node)]
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
      types.push(['default', resolver.response.response(node)])
      continue
    }

    const code = getStatusCodeNumber(response.statusCode)
    if (code === null) {
      continue
    }

    types.push([code, isSuccessStatusCode(code) ? resolver.response.response(node) : resolver.response.status(node, response.statusCode)])
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
