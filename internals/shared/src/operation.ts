import { jsDocEscape } from '@internals/utils'
import { ast, type Group, type Memo, type Output, type Resolver, type ResolverFileParams } from '@kubb/kit'

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

/**
 * Resolves the file a schema-emitting plugin (`plugin-ts`, `plugin-zod`, `plugin-faker`) writes
 * `node` to, cached in `ctx.memo` under the resolver's plugin name and the
 * operation. The plugin itself and every plugin that imports from it call this, so they all get
 * the same path.
 *
 * When that path matches the file of a component schema in `ctx.driver.inputNode`, ignoring case, the file name
 * gets an `Operation` suffix: operation `point` goes to `PointOperation.ts` next to schema `Point.ts`.
 * Otherwise the two merge into one file, or overwrite each other on a case-insensitive file system.
 * Only the file name changes. The declarations keep their names.
 *
 * @example Resolve `plugin-ts`'s file for the current operation
 * ```ts
 * const fileTs = resolveOperationFile({ ctx, node, resolver: tsResolver, root, output })
 * ```
 */
export function resolveOperationFile(options: {
  ctx: { memo: Memo; driver: { inputNode?: { schemas: ReadonlyArray<ast.SchemaNode> } | null } }
  node: ast.OperationNode
  resolver: Pick<Resolver, 'file' | 'pluginName'>
  root: string
  output: Output
  group?: Group | null
}): ast.FileNode {
  const { ctx, node, resolver, root, output } = options
  const { memo } = ctx
  const location = { root, output, group: options.group ?? undefined }

  return memo(`${resolver.pluginName}:operationFile:${node.operationId}`, () => {
    const schemaPaths = memo(
      `${resolver.pluginName}:schemaFilePaths`,
      () =>
        new Set(
          (ctx.driver.inputNode?.schemas ?? []).flatMap((schema) =>
            schema.name ? [resolver.file({ name: schema.name, extname: '.ts', ...location }).path.toLowerCase()] : [],
          ),
        ),
    )
    let file = resolver.file({ ...operationFileEntry(node, node.operationId), ...location })

    for (let name = `${node.operationId}Operation`; schemaPaths.has(file.path.toLowerCase()); name += 'Operation') {
      const next = resolver.file({ ...operationFileEntry(node, name), ...location })
      // A single-file output holds every declaration on purpose, so a new name changes nothing.
      if (next.path === file.path) break
      file = next
    }

    return file
  })
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
      cookies(node: ast.OperationNode, param: ast.ParameterNode): string
    }
  }

export type BuildOperationCommentsOptions = {
  splitLines?: boolean
}

export type OperationParameterGroups = Record<Exclude<ast.ParameterNode['in'], 'querystring'>, Array<ast.ParameterNode>>

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

/**
 * The operation's method and path as plain text, such as `` `GET /pet/{petId}` ``. A path is not a valid `{@link}` target.
 */
function getOperationRequestLine(node: ast.OperationNode): string | null {
  return ast.http.is(node) && node.path ? `\`${node.method.toUpperCase()} ${node.path}\`` : null
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
  return buildContentTypeInfo(ast.http.responses.primary(node)?.content?.map((e) => e.contentType) ?? [])
}

type ResponseType = 'blob' | 'text' | 'stream'

type ResponseContentEntry = { contentType: string; schema?: ast.SchemaNode | null; stream?: ast.ContentNode['stream'] }

/**
 * Whether a content entry is a sequence of JSON values the adapter marks as a stream, such as `application/jsonl`,
 * `application/x-ndjson` or `application/json-seq`.
 */
function isJsonLines(entry: ResponseContentEntry): boolean {
  const baseType = ast.mediaType.base(entry.contentType)
  return Boolean(entry.stream) && baseType !== 'text/event-stream' && ast.mediaType.isStream(baseType)
}

/**
 * How an operation streams its primary success response item by item, when that response declares one content type:
 * - `'event'` for `text/event-stream` whose `itemSchema` types the whole event with its own `event` and `data`
 * - `'data'` for `text/event-stream` typed by its payload only
 * - `'line'` for JSON Lines, one parsed JSON value per line
 *
 * Returns `null` for any other response, and for a response that also declares another content type, which stays a normal
 * call with its query hooks.
 */
export function getEventStream(node: ast.OperationNode): 'event' | 'data' | 'line' | null {
  const content = ast.http.responses.primary(node)?.content ?? []
  if (content.length !== 1) return null
  const entry = content[0]!
  if (ast.mediaType.base(entry.contentType) === 'text/event-stream') return entry.stream?.shape ?? 'data'
  return isJsonLines(entry) ? 'line' : null
}

/**
 * Whether an operation streams its primary success response, as Server-Sent Events or JSON Lines. The client generator uses
 * this to return a typed stream of items instead of a one-shot `RequestResult`.
 */
export function isEventStream(node: ast.OperationNode): boolean {
  return getEventStream(node) !== null
}

// A stream without a schema is a `blob` with a string primitive, so it keeps the JSON-parse default.
function isTextSchema(schema: ast.SchemaNode | null | undefined): boolean {
  if (!schema) return false
  const resolved = ast.resolveRef(schema)
  return resolved.type !== 'blob' && resolved.primitive === 'string'
}

/**
 * Whether an operation streams Server-Sent Events whose `data` the document types as a string, so the client keeps each
 * `data` as text instead of JSON-parsing it. With an event-shaped `itemSchema` where only some events type `data` as a
 * string, it returns the names of those events, or `false` when one of them has no fixed name.
 */
export function hasTextEventData(node: ast.OperationNode): boolean | Array<string> {
  const shape = getEventStream(node)
  const entry = ast.http.responses.primary(node)?.content?.[0]
  if (!entry || (shape !== 'data' && shape !== 'event')) return false
  if (shape === 'data') return isTextSchema(entry.stream?.schema ?? entry.schema)

  const item = entry.stream?.schema ? ast.resolveRef(entry.stream.schema) : undefined
  if (!item) return false
  const events = item.type === 'union' ? (ast.narrowSchema(item, 'union')?.members ?? []) : [item]
  // A discriminator makes each event an intersection of its `$ref` and the pinned `event`, so every part is read.
  const propertySchemas = (event: ast.SchemaNode, propertyName: string) =>
    ast.resolveSchemaProperties({ node: event, propertyName }).map(({ schema }) => schema)
  const textEvents = events.filter((event) => {
    const dataSchemas = propertySchemas(event, 'data')
    return dataSchemas.length > 0 && dataSchemas.every(isTextSchema)
  })
  if (textEvents.length === events.length) return events.length > 0

  const eventNames = textEvents.map((event) => propertySchemas(event, 'event').flatMap((schema) => ast.getSchemaLiteralValues(ast.resolveRef(schema))))
  return eventNames.length > 0 && eventNames.every((values) => values.length > 0) && [...new Set(eventNames.flat().map(String))]
}

/**
 * Whether the primary success response offers `text/event-stream`, alone or next to other content types. The client asks
 * for the stream by default and ships the `sse.ts` runtime, so a mixed response can be read as events too.
 */
export function hasEventStreamContent(node: ast.OperationNode): boolean {
  const entries = ast.http.responses.primary(node)?.content ?? []
  // Next to another type, a stream without a schema gets no typed variant, so it keeps the plain call.
  return entries.some((entry) => ast.mediaType.base(entry.contentType) === 'text/event-stream' && (entries.length === 1 || Boolean(entry.schema)))
}

/**
 * Whether a success response offers a stream media type next to other content types. The client returns that variant's
 * body as a `ReadableStream`, so the stream runtime is registered and a hook's data type includes the stream.
 */
export function hasStreamVariant(node: ast.OperationNode): boolean {
  return ast.http.responses.success(node).some((response) => {
    const variants = (response.content ?? []).filter((entry) => entry.schema)
    return variants.length > 1 && variants.some((entry) => ast.mediaType.isStream(entry.contentType))
  })
}

const formContentTypes = ['multipart/form-data', 'application/x-www-form-urlencoded'] as const

/**
 * The form media types the operation's request body offers, `multipart/form-data` and `application/x-www-form-urlencoded`,
 * which the client needs a handler for.
 */
export function getFormContentTypes(node: ast.OperationNode): Array<(typeof formContentTypes)[number]> {
  const request = new Set((node.requestBody?.content ?? []).map((entry) => ast.mediaType.base(entry.contentType)))
  return formContentTypes.filter((contentType) => request.has(contentType))
}

/**
 * Parser for one response content entry.
 *
 * JSON stays unset so the runtime detects it. `text/event-stream` and JSON Lines are streams. A binary schema
 * (`format: binary` / `contentMediaType`) is a blob even when the media type is not a well-known
 * binary type. Other `text/*` is text, and `application/octet-stream`, `application/pdf`,
 * `image/*`, `audio/*`, and `video/*` are blobs.
 */
function responseTypeForContent(entry: ResponseContentEntry): ResponseType | undefined {
  const baseType = ast.mediaType.base(entry.contentType)
  if (!baseType) return undefined
  if (baseType === 'text/event-stream' || isJsonLines(entry)) return 'stream'
  if (ast.mediaType.isJson(baseType)) return undefined
  if (entry.schema?.type === 'blob') return 'blob'
  if (baseType.startsWith('text/')) return 'text'
  if (isBinaryContentType(baseType)) return 'blob'
  return undefined
}

function isBinaryContentType(baseType: string): boolean {
  return baseType === 'application/octet-stream' || baseType === 'application/pdf' || /^(image|audio|video)\//.test(baseType)
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
 * Returns the entry with the schema of the value the client returns: `string` for a body read as text, such as `Pet` on
 * `application/xml`, and `blob` for `image/*`, `audio/*`, `video/*`, PDF, and octet-stream. A binary schema elsewhere is a `Blob`
 * only through `parseAs: 'blob'`, which needs every entry in `entries` binary. JSON, vendor (`application/vnd.*`), stream,
 * schemaless, and wildcard entries keep their schema. `entries` is the response's full list of content types.
 */
export function toResponseContent<T extends ContentVariantInput & ResponseContentEntry>(entry: T, entries: ReadonlyArray<ResponseContentEntry> = [entry]): T {
  const { contentType, schema } = entry
  if (!schema || entry.stream) return entry

  const baseType = ast.mediaType.base(contentType)
  const resolved = ast.resolveRef(schema)
  if (isBinaryContentType(baseType)) {
    return resolved.type === 'blob' ? entry : { ...entry, schema: ast.factory.createSchema({ type: 'blob' }), keysToOmit: null }
  }
  const isPlainMediaType = Boolean(baseType) && !ast.mediaType.isJson(baseType) && !baseType.includes('*')
  if (resolved.type === 'blob') {
    // shortcut: an error response never gets `parseAs`, so a lone binary schema there reads as text too but stays `Blob`.
    const readsAsText = isPlainMediaType && !entries.every((item) => item.schema?.type === 'blob')
    return readsAsText ? { ...entry, schema: ast.factory.createSchema({ type: 'string' }), keysToOmit: null } : entry
  }
  if (resolved.primitive === 'string') return entry

  const responseType = responseTypeForContent(entry)
  // A response without a body, such as a 405, has no schema to read. Only `text/*` is always text.
  if (responseType !== 'text' && (resolved.type === 'unknown' || resolved.type === 'any' || resolved.type === 'void')) return entry
  const isVendorJson = /^[^/]+\/vnd\./.test(baseType) && !/(xml|yaml|yml|csv)$/.test(baseType)
  const isText = responseType === 'text' || (!responseType && isPlainMediaType && !isVendorJson)

  return isText ? { ...entry, schema: ast.factory.createSchema({ type: 'string' }), keysToOmit: null } : entry
}

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

/**
 * Builds the `client?:` option type shared by the generated query hooks (`useQuery`,
 * `useInfiniteQuery`, `useSWR`, ...): `RequestConfig` minus what the
 * hook fills in, which is every request group and `throwOnError`. Unlike {@link buildRequestConfigType},
 * it never narrows `contentType`: query hooks wrap GET operations, which carry no request body to select
 * a content type for.
 */
export function buildClientOptionType(options: { omit?: Array<string> } = {}): string {
  const keys = [...requestGroupOrder, 'url', ...(options.omit ?? []), 'throwOnError']
  return `Partial<Omit<RequestConfig, ${keys.map((key) => `'${key}'`).join(' | ')}>>`
}

/**
 * The `client?:` option type of a mutation hook. When the operation has a request content type choice,
 * the mutation variables carry `contentType`, so the config leaves it out. Otherwise the ambiguous side is
 * narrowed to the operation's media types; a single-type side has nothing to pick, so it stays baked in the
 * generated call.
 */
export function buildRequestConfigType(node: ast.OperationNode): string {
  if (hasRequestContentTypeChoice(node)) {
    return buildClientOptionType({ omit: ['contentType'] })
  }

  const request = getContentTypeInfo(node)
  const response = getResponseContentTypeInfo(node)
  const members = [
    request.isMultipleContentTypes ? `request?: ${request.contentTypeUnion}` : null,
    response.isMultipleContentTypes ? `response?: ${response.contentTypeUnion}` : null,
  ].filter(Boolean)

  const base = buildClientOptionType()
  return members.length ? `${base} & { contentType?: { ${members.join('; ')} } }` : base
}

/** The grouped request options, in the order generated signatures and calls list them. */
export const requestGroupOrder = ['path', 'query', 'body', 'headers', 'cookies'] as const

export type RequestGroups = {
  path: boolean
  query: boolean
  body: boolean
  headers: boolean
  cookies: boolean
}

/**
 * Which of the grouped request options an operation carries.
 */
export function getRequestGroups(node: ast.OperationNode): RequestGroups {
  const { path, query, header, cookie } = getOperationParameters(node)
  return {
    path: path.length > 0,
    query: query.length > 0,
    body: Boolean(node.requestBody?.content?.[0]?.schema),
    headers: header.length > 0,
    cookies: cookie.length > 0,
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
    // `cookies` never makes the parameter required: a browser sends its cookies itself and cannot set a `Cookie` header.
    isOptional: !hasRequiredPath && !hasRequiredQuery && !hasRequiredHeader && !(groups.body && node.requestBody?.required === true),
  }
}

export type RequestOptionsNameResolver = RequestConfigResolver & {
  response: {
    options(node: ast.OperationNode): string
  }
}

/**
 * Builds the grouped `{ path, query, body, headers, cookies }` parameter for a generated client
 * function, typed from the operation's `Options` (minus `url`). Only the groups the
 * operation actually has are destructured. The trailing `config` parameter carries the
 * runtime `RequestConfig` overrides plus `client`.
 */
export function buildRequestParamsSignature(
  node: ast.OperationNode,
  resolver: RequestOptionsNameResolver,
  options: { isConfigurable?: boolean } = {},
): { signature: string; groups: RequestGroups; names: Array<keyof RequestGroups> } {
  const { isConfigurable = true } = options
  const { groups, isOptional } = getRequestGroupOptionality(node)

  const names = requestGroupOrder.filter((key) => groups[key])

  // These callers never carry the `contentType` that several media types require.
  const optionsType = hasRequestContentTypeChoice(node)
    ? `Pick<${resolver.response.options(node)}, ${names.map((name) => `'${name}'`).join(' | ')}>`
    : resolver.response.options(node)
  const firstParam = names.length > 0 ? `{ ${names.join(', ')} }: ${optionsType}${isOptional ? ' = {}' : ''}` : null
  const configParam = isConfigurable ? `config: ${buildRequestConfigType(node)} = {}` : null

  return {
    signature: [firstParam, configParam].filter(Boolean).join(', '),
    groups,
    names,
  }
}

export function buildOperationComments(node: ast.OperationNode, options: BuildOperationCommentsOptions = {}): Array<string> {
  const { splitLines = false } = options
  // The request line leads: free text after a block tag would belong to that tag.
  const comments = [
    getOperationRequestLine(node),
    node.description && `@description ${node.description}`,
    node.summary && `@summary ${node.summary}`,
    node.deprecated && '@deprecated',
    node.externalDocs && `@see ${jsDocEscape([node.externalDocs.url, node.externalDocs.description].filter(Boolean).join(' '))}`,
  ]

  const filteredComments = comments.filter((comment): comment is string => Boolean(comment))

  if (!splitLines) {
    return filteredComments
  }

  return filteredComments.flatMap((text) => text.split(/\r?\n/).map((line) => line.trim())).filter((comment): comment is string => Boolean(comment))
}

const operationParameterGroupsByNode = new WeakMap<ast.OperationNode, OperationParameterGroups>()

/**
 * An OpenAPI 3.2 `querystring` parameter is the whole query string, so a form-encoded object becomes one query parameter
 * per property, typed and serialized like any other, with the `style` and `explode` its `encoding` entry declares.
 * Another content type, such as JSON, stays one parameter named after it, and the runtime sends its value as the whole query string.
 */
function spreadQuerystring(param: ast.ParameterNode): Array<ast.ParameterNode> {
  const schema = param.schema.type === 'ref' ? param.schema.schema : param.schema
  const formEncoded = !param.contentType || ast.mediaType.base(param.contentType) === 'application/x-www-form-urlencoded'
  if (schema?.type !== 'object' || !formEncoded) return [param]
  return schema.properties.map((property) => {
    const { style, explode, allowReserved } = param.encoding?.[property.name] ?? {}
    return ast.factory.createParameter({
      name: property.name,
      in: 'query',
      schema: property.schema,
      required: param.required && property.required,
      ...(style !== undefined && { style }),
      ...(explode !== undefined && { explode }),
      ...(allowReserved !== undefined && { allowReserved }),
    })
  })
}

/**
 * Groups an operation's parameters by location (`path`/`query`/`header`/`cookie`), deduping each
 * group by name. Every plugin generator visiting the same `OperationNode` shares one AST instance
 * (see `KubbDriver`), so the result is cached per node to avoid re-filtering and re-deduping the
 * same parameters once per plugin.
 */
export function getOperationParameters(node: ast.OperationNode): OperationParameterGroups {
  const cached = operationParameterGroupsByNode.get(node)
  if (cached) return cached

  const groups = ast.http.parameters(node)
  // shortcut: the OpenAPI 3.2 `querystring` spread stays here until adapter-oas emits plain query parameters.
  const names = new Set(groups.query.map((param) => param.name))
  for (const param of node.parameters.filter((param) => param.in === 'querystring').flatMap(spreadQuerystring)) {
    if (names.has(param.name)) continue
    names.add(param.name)
    groups.query.push(param)
  }

  operationParameterGroupsByNode.set(node, groups)
  return groups
}

/**
 * Whether the operation declares more than one request media type with a schema, so a caller must pick one on `contentType`.
 */
export function hasRequestContentTypeChoice(node: ast.OperationNode): boolean {
  return (node.requestBody?.content ?? []).filter((entry) => entry.schema).length > 1
}

/**
 * Casts a call argument to the client's parameter type; a `'plain'` client is non-generic.
 */
export function castToClientOptions(callArg: string, clientName: string, returnType: 'full' | 'data' | 'plain' = 'full'): string {
  return `${callArg} as Parameters<typeof ${clientName}${returnType === 'plain' ? '' : '<true>'}>[0]`
}

/**
 * Builds the combined `{ body, path, query, headers, cookies }` options object schema for an operation,
 * referencing the already-resolved body and grouped param names. `cookies` appears only on an operation
 * with a cookie parameter, and stays optional because a browser sends its cookies itself. Shared by `@kubb/plugin-ts`'s
 * `Options` type and `@kubb/plugin-zod`'s inferred options schema, so both printers emit the same shape from the same inputs.
 * `primitive: 'object'` is a no-op for the TS printer and tells the Zod printer to emit `z.object(…)` rather
 * than a record.
 */
export function buildOptionsSchema(node: ast.OperationNode, resolver: OperationTypeNameResolver, { pairContentTypes = false } = {}): ast.SchemaNode {
  const { path, query, header, cookie } = getOperationParameters(node)
  const hasBody = Boolean(node.requestBody?.content?.[0]?.schema)
  const createNever = () => ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true })
  const groups = [
    { name: 'path', params: path, resolve: resolver.param.path },
    { name: 'query', params: query, resolve: resolver.param.query },
    { name: 'headers', params: header, resolve: resolver.param.headers },
    { name: 'cookies', params: cookie, resolve: resolver.param.cookies },
  ] as const

  const createOptions = (body: ast.SchemaNode, extra: Array<ast.PropertyNode> = []) =>
    // NOTE(v5-stable): the fields were renamed from the legacy beta shape
    // (`data`/`pathParams`/`queryParams`/`headerParams`) to `body`/`path`/`query`/`headers` so the
    // type matches the runtime client. Drop this note once v5 leaves beta.
    ast.factory.createSchema({
      type: 'object',
      primitive: 'object',
      deprecated: node.deprecated,
      properties: [
        ast.factory.createProperty({ name: 'body', required: hasBody && node.requestBody?.required === true, schema: body }),
        ...groups
          .filter(({ name, params }) => name !== 'cookies' || params.length > 0)
          .map(({ name, params, resolve }) => {
            const required = name !== 'cookies' && params.some((param) => param.required)

            return ast.factory.createProperty({
              name,
              required,
              schema:
                params.length > 0
                  ? ast.factory.createSchema({ type: 'ref', name: resolve.call(resolver.param, node, params[0]!), optional: !required })
                  : createNever(),
            })
          }),
        ...extra,
      ],
    })

  const variants =
    pairContentTypes && hasRequestContentTypeChoice(node) ? resolveContentTypeVariants(node.requestBody?.content ?? [], resolver.response.body(node)) : []
  if (variants.length < 2) {
    return createOptions(hasBody ? ast.factory.createSchema({ type: 'ref', name: resolver.response.body(node) }) : createNever())
  }

  // The first media type is the runtime default, so only the others must pass `contentType`. A bare string sets the
  // request content type at runtime, so it is accepted next to the `{ request }` form.
  return ast.factory.createSchema({
    type: 'union',
    members: variants.map((variant, index) => {
      const contentType = ast.factory.createSchema({ type: 'enum', enumValues: [variant.contentType] })

      return createOptions(ast.factory.createSchema({ type: 'ref', name: variant.name }), [
        ast.factory.createProperty({
          name: 'contentType',
          required: index > 0,
          schema: ast.factory.createSchema({
            type: 'union',
            members: [
              contentType,
              ast.factory.createSchema({
                type: 'object',
                primitive: 'object',
                properties: [ast.factory.createProperty({ name: 'request', required: true, schema: contentType })],
              }),
            ],
          }),
        }),
      ])
    }),
  })
}

/**
 * The schema a status occupies in the `<Name>Responses` record. A status that documents several
 * content types becomes a `{ contentType; data }` union so the runtime can surface the negotiated type
 * on `result.parsed`, while the standalone `<Name>StatusNNN` alias stays the plain body union that the
 * query hooks and `result.data` use. With `streamData`, the stream variant of a 2xx status holds that schema, since the
 * client returns its body unread.
 */
function buildResponseRecordEntry(
  node: ast.OperationNode,
  res: ast.ResponseNode,
  resolver: ResponseStatusNameResolver,
  streamData: ast.SchemaNode | undefined,
): ast.SchemaNode {
  const statusName = resolver.response.status(node, res.statusCode)
  const variants = (res.content ?? []).filter((entry) => entry.schema)
  if (variants.length <= 1) {
    return ast.factory.createSchema({ type: 'ref', name: statusName })
  }

  return ast.factory.createSchema({
    type: 'union',
    members: resolveContentTypeVariants(variants, statusName).map((variant) =>
      ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.factory.createProperty({
            name: 'contentType',
            required: true,
            // The runtime reports the bare media type, without parameters such as `charset` or `profile`.
            schema: ast.factory.createSchema({ type: 'enum', enumValues: [ast.mediaType.base(variant.contentType)] }),
          }),
          ast.factory.createProperty({
            name: 'data',
            required: true,
            schema:
              streamData && ast.http.status.isSuccess(res.statusCode) && ast.mediaType.isStream(variant.contentType)
                ? streamData
                : ast.factory.createSchema({ type: 'ref', name: variant.name }),
          }),
        ],
      }),
    ),
  })
}

/**
 * Builds the per-status `<Name>Responses` record for an operation, referencing the already-resolved
 * `<Name>StatusNNN` names. Shared by `@kubb/plugin-ts`'s `Responses` type and `@kubb/plugin-zod`'s
 * inferred responses schema, so both emit the same shape from the same inputs.
 *
 * Always emits the keyed record, even when an operation declares no responses. An operation with no
 * responses renders as an empty object, which keeps every consumer's import (for example the axios
 * SDK's `RequestResult<XResponses>`) resolvable instead of pointing at a missing export.
 *
 * `streamData` is the type of a stream variant's `data`, such as a `ReadableStream<Uint8Array>` reference.
 */
export function buildResponses(
  node: ast.OperationNode,
  resolver: ResponseStatusNameResolver,
  { streamData }: { streamData?: ast.SchemaNode } = {},
): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'object',
    primitive: 'object',
    properties: node.responses.map((res) =>
      ast.factory.createProperty({
        name: String(res.statusCode),
        required: true,
        schema: buildResponseRecordEntry(node, res, resolver, streamData),
      }),
    ),
  })
}

export function getStatusCodeNumber(statusCode: ast.StatusCode | number | string): number | null {
  const code = Number(statusCode)

  return Number.isNaN(code) ? null : code
}

export function resolveErrorNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): string[] {
  return node.responses
    .filter((response) => ast.http.status.isError(response.statusCode))
    .map((response) => resolver.response.status(node, response.statusCode))
}

export function resolveSuccessNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): string[] {
  return node.responses
    .filter((response) => ast.http.status.isSuccess(response.statusCode))
    .map((response) => resolver.response.status(node, response.statusCode))
}

export function resolveStatusCodeNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): string[] {
  return node.responses.map((response) => resolver.response.status(node, response.statusCode))
}

/**
 * Lists the type names an operation's types file declares, computed once per resolver and `options` so every
 * dependent reads the same list.
 */
export function resolveOperationTypeNames(
  node: ast.OperationNode,
  resolver: OperationTypeNameResolver & Pick<Resolver, 'memo'>,
  options: ResolveOperationTypeNameOptions = {},
): string[] {
  const key = `${node.operationId}\0${options.order ?? ''}\0${options.responseStatusNames ?? ''}\0${options.includeParams === false ? 'noparams' : ''}\0${(options.exclude ?? []).join(',')}`
  return resolver.memo(`operationTypeNames:${key}`, () => {
    const { path, query, header, cookie } = getOperationParameters(node)
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
            ...cookie.map((param) => resolver.param.cookies(node, param)),
          ]
    const bodyAndResponseNames = [node.requestBody?.content?.[0]?.schema ? resolver.response.body(node) : null, resolver.response.response(node)]
    const names =
      options.order === 'body-response-first'
        ? [...bodyAndResponseNames, ...paramNames, ...responseStatusNames]
        : [...paramNames, ...bodyAndResponseNames, ...responseStatusNames]

    return names.filter((name): name is string => Boolean(name) && !exclude.has(name as string))
  })
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

    types.push([code, ast.http.status.isSuccess(code) ? resolver.response.response(node) : resolver.response.status(node, response.statusCode)])
  }

  return types
}
