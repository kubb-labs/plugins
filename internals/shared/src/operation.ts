import { ast } from '@internals/ast'
import { jsDocEscape } from '@internals/utils'
import { casing, type Resolver } from '@kubb/kit'
import type { Direction } from './types.ts'

export type ContentTypeInfo = {
  contentTypes: Array<string>
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

export type ResolveOperationTypeNamesOptions = {
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
  return ast.http.isOperation(node) && node.path ? `\`${node.method.toUpperCase()} ${node.path}\`` : null
}

/**
 * Derives the shared `ContentTypeInfo` shape from a list of content types, tracking whether several
 * are present and the union, default, and form-data flags the client uses to pick one.
 */
function buildContentTypeInfo(contentTypes: Array<string>): ContentTypeInfo {
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
  return buildContentTypeInfo(ast.http.getRequestGroups(node).contentTypes)
}

/**
 * The request-body counterpart for the primary success response: the content types it documents and
 * whether several are present, so the client can let a caller pick which one to accept.
 */
export function getResponseContentTypeInfo(node: ast.OperationNode): ContentTypeInfo {
  return buildContentTypeInfo(ast.http.responses.findPrimary(node)?.content?.map((e) => e.contentType) ?? [])
}

/** How an operation streams its success responses, as {@link getStream} returns it. */
export type ResponseStream = {
  /** `event` for a whole typed event, `data` for a typed payload, `line` for a JSON Lines value. */
  shape: 'event' | 'data' | 'line' | null
  /** Whether events keep `data` as text: all of them, the named ones, or none. */
  textEvents: boolean | Array<string>
  /** Whether the primary success response offers `text/event-stream`. */
  hasEventStream: boolean
  /** Whether a success response offers a stream next to other content types. */
  hasVariant: boolean
}

const isText = (schema: ast.SchemaNode | null | undefined) => !!schema && ast.schema.is(schema, 'text', { follow: ['ref'] })

function getTextEvents(entry: ast.ContentNode, shape: ResponseStream['shape']): ResponseStream['textEvents'] {
  if (shape === 'data') return isText(entry.stream?.schema ?? entry.schema)
  if (shape !== 'event' || !entry.stream?.schema) return false

  const item = ast.ref.getSchema(entry.stream.schema)
  const events = ast.schema.narrow(item, 'union')?.members ?? [item]
  // A discriminator makes each event an intersection of its `$ref` and the pinned `event`, so every part is read.
  const propertySchemas = (event: ast.SchemaNode, propertyName: string) => ast.schema.findProperties({ node: event, propertyName }).map(({ schema }) => schema)
  const textEvents = events.filter((event) => {
    const dataSchemas = propertySchemas(event, 'data')
    return dataSchemas.length > 0 && dataSchemas.every(isText)
  })
  if (textEvents.length === events.length) return events.length > 0

  const eventNames = textEvents.map((event) => propertySchemas(event, 'event').flatMap((schema) => ast.schema.getLiterals(ast.ref.getSchema(schema))))
  // An event without a fixed name cannot be told apart from the others.
  if (!eventNames.length || eventNames.some((values) => !values.length)) return false
  return [...new Set(eventNames.flat().map(String))]
}

/** How an operation streams its success responses, or `null` when none offers a stream. */
export function getStream(node: Pick<ast.HttpOperationNode, 'responses'>): ResponseStream | null {
  const entries = ast.http.responses.findPrimary(node)?.content ?? []
  const entry = entries.length === 1 ? entries[0] : undefined
  const kind = entry ? ast.mediaType.getKind(entry) : null
  const shape = kind === 'eventStream' ? (entry?.stream?.shape ?? 'data') : kind === 'lineStream' ? 'line' : null
  // Next to another type, a stream without a schema gets no typed variant, so it keeps the plain call.
  const hasEventStream = entries.some((item) => ast.mediaType.getKind(item) === 'eventStream' && (entries.length === 1 || !!item.schema))
  const hasVariant = ast.http.responses.filterSuccess(node).some((response) => {
    const variants = (response.content ?? []).filter((item) => item.schema)
    return variants.length > 1 && variants.some(ast.mediaType.isStream)
  })
  if (!shape && !hasEventStream && !hasVariant) return null

  return { shape, textEvents: entry ? getTextEvents(entry, shape) : false, hasEventStream, hasVariant }
}

type ResponseType = 'blob' | 'text' | 'stream'

export type ResponseContentEntry = { contentType: string; schema?: ast.SchemaNode | null; stream?: ast.ContentNode['stream'] }

const responseTypes: Partial<Record<ast.mediaType.MediaKind, ResponseType>> = {
  eventStream: 'stream',
  lineStream: 'stream',
  binary: 'blob',
  text: 'text',
}

/**
 * Maps a content type to the PascalCase suffix used to name per-content-type variants
 * (e.g. `application/json` → `Json`, `application/xml` → `Xml`, `multipart/form-data` → `FormData`).
 */
function getContentTypeSuffix(contentType: string): string {
  // Keeps the original case, unlike ast.mediaType.getBase, so generated names stay stable.
  const baseType = contentType.split(';')[0]!.trim()
  if (baseType === 'application/json') return 'Json'
  if (baseType === 'multipart/form-data') return 'FormData'
  if (baseType === 'application/x-www-form-urlencoded') return 'FormUrlEncoded'
  const subtype = baseType.split('/').pop() ?? baseType
  const parts = subtype.split(/[^a-zA-Z0-9]+/).filter(Boolean)
  if (parts.length === 0) return 'Unknown'
  return parts.map(casing.capitalize).join('')
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

  const baseType = ast.mediaType.getBase(contentType)
  const resolved = ast.ref.getSchema(schema)
  if (ast.mediaType.getKind(baseType) === 'binary') {
    return resolved.type === 'blob' ? entry : { ...entry, schema: ast.factory.createSchema({ type: 'blob' }), keysToOmit: null }
  }
  const isPlainMediaType = Boolean(baseType) && !ast.mediaType.isJson(baseType) && !baseType.includes('*')
  if (resolved.type === 'blob') {
    // shortcut: an error response never gets `parseAs`, so a lone binary schema there reads as text too but stays `Blob`.
    const readsAsText = isPlainMediaType && !entries.every((item) => item.schema?.type === 'blob')
    return readsAsText ? { ...entry, schema: ast.factory.createSchema({ type: 'string' }), keysToOmit: null } : entry
  }
  if (resolved.primitive === 'string') return entry

  const kind = ast.mediaType.getKind(entry)
  const responseType = kind ? responseTypes[kind] : undefined
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
  if (ast.http.getRequestGroups(node).hasContentTypeChoice) {
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

export type RequestOptionsNameResolver = RequestConfigResolver & {
  response: {
    options(node: ast.OperationNode): string
  }
}

export type BuildRequestParamsSignatureOptions = { isConfigurable?: boolean }

/**
 * Builds the grouped `{ path, query, body, headers, cookies }` parameter for a generated client
 * function, typed from the operation's `Options` (minus `url`). Only the groups the
 * operation actually has are destructured. The trailing `config` parameter carries the
 * runtime `RequestConfig` overrides plus `client`.
 */
export function buildRequestParamsSignature(
  node: ast.OperationNode,
  resolver: RequestOptionsNameResolver,
  options: BuildRequestParamsSignatureOptions = {},
): { signature: string; groups: ast.http.RequestGroups; names: Array<(typeof requestGroupOrder)[number]> } {
  const { isConfigurable = true } = options
  const groups = ast.http.getRequestGroups(node)

  const names = requestGroupOrder.filter((key) => groups[key])

  // These callers never carry the `contentType` that several media types require.
  const optionsType = groups.hasContentTypeChoice
    ? `Pick<${resolver.response.options(node)}, ${names.map((name) => `'${name}'`).join(' | ')}>`
    : resolver.response.options(node)
  const firstParam = names.length > 0 ? `{ ${names.join(', ')} }: ${optionsType}${groups.isOptional ? ' = {}' : ''}` : null
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
    node.description && `@description ${jsDocEscape(node.description)}`,
    node.summary && `@summary ${jsDocEscape(node.summary)}`,
    node.deprecated && '@deprecated',
    node.externalDocs && `@see ${jsDocEscape([node.externalDocs.url, node.externalDocs.description].filter(Boolean).join(' '))}`,
  ]

  const filteredComments = comments.filter((comment): comment is string => Boolean(comment))

  if (!splitLines) {
    return filteredComments
  }

  return filteredComments.flatMap((text) => text.split(/\r?\n/).map((line) => line.trim())).filter((comment): comment is string => Boolean(comment))
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
  const { path, query, header, cookie } = ast.http.groupParameters(node)
  const hasBody = Boolean(ast.http.requestBody.getSchema(node))
  const createNever = () => ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true })
  const groups = [
    { name: 'path', params: path, resolve: resolver.param.path },
    { name: 'query', params: query, resolve: resolver.param.query },
    { name: 'headers', params: header, resolve: resolver.param.headers },
    { name: 'cookies', params: cookie, resolve: resolver.param.cookies },
  ] as const

  const createOptions = (body: ast.SchemaNode, extra: Array<ast.PropertyNode> = []) =>
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
    pairContentTypes && ast.http.getRequestGroups(node).hasContentTypeChoice
      ? resolveContentTypeVariants(node.requestBody?.content ?? [], resolver.response.body(node))
      : []
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
            schema: ast.factory.createSchema({ type: 'enum', enumValues: [ast.mediaType.getBase(variant)] }),
          }),
          ast.factory.createProperty({
            name: 'data',
            required: true,
            schema:
              streamData && ast.http.status.isSuccess(res) && ast.mediaType.isStream(variant)
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

export function resolveErrorNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): Array<string> {
  return ast.http.responses.filterError(node).map((response) => resolver.response.status(node, response.statusCode))
}

export function resolveSuccessNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): Array<string> {
  return ast.http.responses.filterSuccess(node).map((response) => resolver.response.status(node, response.statusCode))
}

export function resolveStatusCodeNames(node: ast.OperationNode, resolver: ResponseStatusNameResolver): Array<string> {
  return node.responses.map((response) => resolver.response.status(node, response.statusCode))
}

/**
 * Lists the type names an operation's types file declares, computed once per resolver and `options` so every
 * dependent reads the same list.
 */
export function resolveOperationTypeNames(
  node: ast.OperationNode,
  resolver: OperationTypeNameResolver & Pick<Resolver, 'memo'>,
  options: ResolveOperationTypeNamesOptions = {},
): Array<string> {
  const key = `${node.operationId}\0${options.order ?? ''}\0${options.responseStatusNames ?? ''}\0${options.includeParams === false ? 'noparams' : ''}\0${(options.exclude ?? []).join(',')}`
  return resolver.memo(`operationTypeNames:${key}`, () => {
    const { path, query, header, cookie } = ast.http.groupParameters(node)
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
    const bodyAndResponseNames = [ast.http.requestBody.getSchema(node) ? resolver.response.body(node) : null, resolver.response.response(node)]
    const names =
      options.order === 'body-response-first'
        ? [...bodyAndResponseNames, ...paramNames, ...responseStatusNames]
        : [...paramNames, ...bodyAndResponseNames, ...responseStatusNames]

    return names.filter((name): name is string => Boolean(name) && !exclude.has(name as string))
  })
}

/**
 * One object schema for a list of parameters or response headers, with each schema inline.
 */
export function buildParamsSchema(params: Array<ast.ParameterNode>): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'object',
    // `primitive: 'object'` makes a printer emit an object schema and not a record.
    primitive: 'object',
    properties: params.map((param) => ast.factory.createProperty({ name: param.name, required: param.required, schema: param.schema })),
  })
}

/**
 * One object schema for the parameters of an operation, where each key points at the const of
 * that parameter. The const already has its optional wrapper, so every key is required here.
 */
export function buildParamRefsSchema({
  node,
  params,
  resolver,
}: {
  node: ast.OperationNode
  params: Array<ast.ParameterNode>
  resolver: { param: { name(node: ast.OperationNode, param: ast.ParameterNode): string } }
}): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'object',
    primitive: 'object',
    properties: params.map((param) =>
      ast.factory.createProperty({
        name: param.name,
        required: true,
        schema: ast.factory.createSchema({ type: 'ref', name: resolver.param.name(node, param) }),
      }),
    ),
  })
}

export type SchemaEntry = { schema: ast.SchemaNode; name: string; keysToOmit?: Array<string> | null }

/**
 * The schemas a name with several content types needs: one per content type, then the union of
 * them under `baseName`.
 */
export function buildContentTypeEntries(
  entries: Array<ContentVariantInput>,
  baseName: string,
  decorate: (schema: ast.SchemaNode) => ast.SchemaNode = (schema) => schema,
): Array<SchemaEntry> {
  const variants = resolveContentTypeVariants(entries, baseName)
  const union = ast.factory.createSchema({
    type: 'union',
    members: variants.map((variant) => ast.factory.createSchema({ type: 'ref', name: variant.name })),
  })

  return [
    ...variants.map((variant) => ({ schema: decorate(variant.schema), name: variant.name, keysToOmit: variant.keysToOmit })),
    { schema: union, name: baseName },
  ]
}

/**
 * The schema behind a response or error name: a union of the per-status schemas. Returns `null`
 * when a response is a `$ref` to a component whose name is already `name`, which would declare it twice.
 */
export function buildResponseUnionSchema({
  node,
  responses,
  name,
  resolver,
  fallbackUnknown,
}: {
  node: ast.OperationNode
  responses: Array<ast.ResponseNode>
  name: string
  resolver: { name(name: string): string; response: { status(node: ast.OperationNode, statusCode: ast.StatusCode): string } }
  /**
   * Print an unknown schema when no response has one, so the name still resolves.
   */
  fallbackUnknown: boolean
}): ast.SchemaNode | null {
  const importedNames = new Set(ast.http.responses.getImportedNames(responses).map((refName) => resolver.name(refName)))
  if (importedNames.has(name)) return null

  const members = responses.map((res) => ast.factory.createSchema({ type: 'ref', name: resolver.response.status(node, res.statusCode) }))
  if (members.length === 0) return fallbackUnknown ? ast.factory.createSchema({ type: 'unknown' }) : null

  return members.length === 1 ? members[0]! : ast.factory.createSchema({ type: 'union', members })
}

export type OperationSchemaEntry = { schema: ast.SchemaNode | null; name: string; keysToOmit?: Array<string> | null; direction?: Direction }

export type OperationSchemaResolver = OperationTypeNameResolver &
  ResponseStatusNameResolver & {
    name(name: string): string
    param: { name(node: ast.OperationNode, param: ast.ParameterNode): string }
    response: {
      headers(node: ast.OperationNode, statusCode: ast.StatusCode): string
      error(node: ast.OperationNode): string
      responses(node: ast.OperationNode): string
    }
  }

export type BuildOperationSchemaEntriesOptions = {
  node: ast.HttpOperationNode
  resolver: OperationSchemaResolver
  inferred: boolean
}

/**
 * The schemas a validator plugin writes into the file of an operation, in file order: every parameter, every response
 * and its headers, the success and error unions, the request body, and the parameter groups. `inferred` adds the
 * options object and the per-status record, for callers that take their types from the plugin.
 * A request-direction entry has `direction: 'encode'`. An entry without a schema is one the caller skips.
 */
export function buildOperationSchemaEntries({ node, resolver, inferred }: BuildOperationSchemaEntriesOptions): Array<OperationSchemaEntry> {
  const encode = (entry: OperationSchemaEntry): OperationSchemaEntry => ({ ...entry, direction: 'encode' })
  const responseUnion = (responses: Array<ast.ResponseNode>, name: string, fallbackUnknown: boolean): OperationSchemaEntry => ({
    schema: buildResponseUnionSchema({ node, responses, name, resolver, fallbackUnknown }),
    name,
  })

  const parameters = node.parameters.map((param) => encode({ schema: param.schema, name: resolver.param.name(node, param) }))

  const responses = node.responses.flatMap((res): Array<OperationSchemaEntry> => {
    const content = (res.content ?? []).map((entry, _, entries) => toResponseContent(entry, entries))
    const variants = content.filter((entry) => entry.schema)
    const name = resolver.response.status(node, res.statusCode)
    // Several content types for one name: one schema per content type, then the union of them.
    if (variants.length > 1) return buildContentTypeEntries(content, name)
    const primary = variants[0] ?? content[0]
    return [{ schema: primary?.schema ?? null, name, keysToOmit: primary?.keysToOmit }]
  })

  const responseHeaders = node.responses
    .filter((res) => res.headers?.length)
    .map((res) => ({ schema: buildParamsSchema(res.headers ?? []), name: resolver.response.headers(node, res.statusCode) }))

  // The response schema covers the success (2xx) bodies, and the error schema every other response, including `default`.
  const withSchema = node.responses.filter((res) => res.content?.some((entry) => entry.schema))
  const success = withSchema.filter((res) => ast.http.status.isSuccess(res))
  const errors = withSchema.filter((res) => !ast.http.status.isSuccess(res))
  const unions = [
    ...(withSchema.length > 0 ? [responseUnion(success, resolver.response.response(node), true)] : []),
    ...(errors.length > 0 ? [responseUnion(errors, resolver.response.error(node), false)] : []),
  ]

  const bodyContent = node.requestBody?.content ?? []
  const describe = (schema: ast.SchemaNode): ast.SchemaNode => ({ ...schema, description: node.requestBody?.description ?? schema.description })
  const [onlyBody] = bodyContent
  const body =
    bodyContent.length > 1
      ? buildContentTypeEntries(bodyContent, resolver.response.body(node), describe)
      : onlyBody?.schema
        ? [{ schema: describe(onlyBody.schema), name: resolver.response.body(node), keysToOmit: onlyBody.keysToOmit }]
        : []

  const { path, query, header, cookie } = ast.http.groupParameters(node)
  const groups = (
    [
      { kind: 'path', params: path },
      { kind: 'query', params: query },
      { kind: 'headers', params: header },
      { kind: 'cookies', params: cookie },
    ] as const
  )
    .filter(({ params }) => params.length > 0)
    .map(({ kind, params }) => ({ schema: buildParamRefsSchema({ node, params, resolver }), name: resolver.param[kind](node, params[0]!) }))

  return [
    ...parameters,
    ...responses,
    ...responseHeaders,
    ...unions,
    ...body.map(encode),
    ...groups.map(encode),
    ...(inferred
      ? [
          encode({ schema: buildOptionsSchema(node, resolver), name: resolver.name(`${node.operationId} Options`) }),
          { schema: buildResponses(node, resolver), name: resolver.response.responses(node) },
        ]
      : []),
  ]
}
