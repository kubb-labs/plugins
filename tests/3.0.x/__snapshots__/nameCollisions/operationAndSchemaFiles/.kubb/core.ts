import type { NativeRequest, NativeResponse } from './client'
import type { MediaTypeContext, MediaTypes } from './mediaTypes'
import type { HeadersInit, Serializers, Styles } from './serializers'
import type { ValidateOption } from './standardSchema'
import type { ClientConfig, ClientInstance, DecodedResponse, EmptyErrorBody, EventStreamOptions, InterceptorFn, Interceptors, InterceptorStack, ParseAs, RequestConfig, RequestResult, ResolvedRequest, RetryContext, ServerSentEvent, StreamResult, Transport, TransportResult, Validator } from './types'
import { appendCookie, getHeader, resolveAuth } from './auth'
import { defaultMediaTypes, isEncodedBody, resolveMediaType } from './mediaTypes'
import { backoff, release, resolveRetry, retryAfter, sleep } from './retry'
import { baseContentType, toValue } from './serializers'
import { isValidationEnabled, runValidator, ValidationError } from './standardSchema'
import { ResponseError } from './types'
export * from './mediaTypes'
export * from './types'
export { getHeader, resolveAuth } from './auth'

function headerEntries(headers: object): Array<[string, unknown]> {
  if (Array.isArray(headers)) return headers as Array<[string, unknown]>
  return headers instanceof Headers ? [...headers] : Object.entries(headers)
}

function serializeHeaders(headers: HeadersInit | Headers | undefined): Record<string, string> {
  if (!headers) return {}
  const entries = headerEntries(headers)
  const result: Record<string, string> = {}
  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue
    // A `Date` is a unit like in the parameter serializers, not an object to send as JSON.
    result[key] = typeof value === 'object' && !(value instanceof Date) ? JSON.stringify(value) : toValue(value)
  }
  return result
}

function collectHeadersCaseInsensitive(...sources: Array<unknown>): Record<string, unknown> {
  const keys = new Map<string, string>()
  const result: Record<string, unknown> = {}
  for (const source of sources) {
    if (!source) continue
    const entries = headerEntries(source)
    for (const [key, value] of entries) {
      if (value === undefined || value === null) continue
      const lowerCase = key.toLowerCase()
      const previous = keys.get(lowerCase)
      if (previous !== undefined) delete result[previous]
      keys.set(lowerCase, key)
      result[key] = value
    }
  }
  return result
}

function deleteHeader(headers: Record<string, string>, name: string): void {
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === name.toLowerCase()) delete headers[key]
  }
}

function serializeUrl({
  parts,
  pathParams,
  query,
  serializers,
  styles,
}: {
  parts: Array<string | undefined>
  pathParams: Record<string, unknown>
  query: Record<string, unknown>
  serializers: Serializers
  styles?: Styles | undefined
}): string {
  const path = parts
    // A base URL that ends in `/` would give `//` before a path that starts with one.
    .reduce<string>((url, part) => (part ? url + (url.endsWith('/') && part.startsWith('/') ? part.slice(1) : part) : url), '')
    .replace(/\{([^{}]+)\}/g, (_, key: string) => {
      const segment = requireSerializer(serializers, 'path')({ name: key, value: pathParams[key], options: styles?.path?.[key] })
      // An empty segment would call another endpoint, such as `/pets/` for `/pets/{petId}`.
      if (segment === '') throw new TypeError(`Missing path parameter ${key}.`)
      // A URL parser resolves a dot segment against the path, also when it is percent-encoded.
      if (segment === '.' || segment === '..') throw new TypeError(`Path parameter ${key} cannot be a dot segment.`)
      return segment
    })
  // A query without values needs no serializer.
  const hasQuery = Object.values(query).some((value) => value !== undefined && value !== null)
  const search = serializers.query || hasQuery ? requireSerializer(serializers, 'query')(query, styles?.query) : ''
  return path + (search ? `?${search}` : '')
}

export function createInterceptorStack<T, TContext = never, TResult = T>(): InterceptorStack<T, TContext, TResult> {
  let entries: Array<{ id: number; fn: InterceptorFn<T, TContext, TResult> }> = []
  let counter = 0
  return {
    use(fn) {
      const id = ++counter
      entries.push({ id, fn })
      return id
    },
    eject(id) {
      entries = entries.filter((entry) => entry.id !== id)
    },
    update(id, fn) {
      const entry = entries.find((item) => item.id === id)
      if (entry) entry.fn = fn
    },
    async run(value, context) {
      let result = value
      for (const entry of entries) {
        const next = await entry.fn(result, context)
        if (next !== undefined) result = next as T
      }
      return result
    },
  }
}

/**
 * The `RequestInit` of a resolved request, for `fetch` or a library that takes the same init, such as ky.
 *
 * @example
 * ```ts
 * client.setConfig({ transport: (request) => ky(request.url, { ...toRequestInit(request), throwHttpErrors: false, retry: 0, timeout: false }) })
 * ```
 */
export function toRequestInit(request: ResolvedRequest): RequestInit {
  const init: RequestInit = {
    ...request.options,
    method: request.method,
    headers: request.headers,
    body: request.body ?? null,
    signal: request.signal ?? null,
  }
  if (request.credentials) init.credentials = request.credentials
  return init
}

function pickErrorValidator(error: Validator | Record<string, Validator> | undefined, status: number): Validator | undefined {
  if (!error || '~standard' in error) return error as Validator | undefined
  const range = String(status)[0]
  return error[String(status)] ?? error[`${range}xx`] ?? error['default']
}

// Checks the shape, so a `Response` from another realm or a polyfill counts too.
function isResponse(value: unknown): value is Response {
  return typeof (value as Response | undefined)?.arrayBuffer === 'function'
}

// Leaves out the body, which was already sent. A relative URL keeps the resolved request.
function toNativeRequest(request: ResolvedRequest): Request | ResolvedRequest {
  try {
    return new Request(request.url, { ...toRequestInit(request), body: null })
  } catch {
    return request
  }
}

async function readAs(response: Response, parseAs: Exclude<ParseAs, 'json'>): Promise<unknown> {
  switch (parseAs) {
    case 'text':
      return response.text()
    case 'blob':
      return response.blob()
    case 'arrayBuffer':
      return response.arrayBuffer()
    case 'stream':
      return response.body ?? undefined
  }
}

function isEmpty(response: Response, method: string): boolean {
  return [204, 205, 304].includes(response.status) || method === 'HEAD' || !response.body || response.headers.get('Content-Length') === '0'
}

function mergeConfig<T extends { headers?: HeadersInit | Headers; mediaTypes?: MediaTypes; serializer?: Serializers }>(config: T, next: T): T {
  return {
    ...config,
    ...next,
    headers: { ...serializeHeaders(config.headers), ...serializeHeaders(next.headers) },
    mediaTypes: { ...config.mediaTypes, ...next.mediaTypes },
    serializer: { ...config.serializer, ...next.serializer },
  }
}

// The serializer for `name`, which `.kubb/client.ts` registers for a spec that needs it.
function requireSerializer<TName extends keyof Serializers>(serializers: Serializers, name: TName): NonNullable<Serializers[TName]> {
  const serializer = serializers[name]
  if (!serializer) throw new TypeError(`Cannot send ${name} parameters without a serializer, register serializer.${name} on the client.`)
  return serializer
}

async function resolveRequest<TBody, TRequest, TResponse>({
  config,
  requestConfig,
}: {
  config: ClientConfig<TRequest, TResponse>
  requestConfig: RequestConfig<TBody, TRequest, TResponse>
}): Promise<{ request: ResolvedRequest; mediaTypes: MediaTypes; validate: ValidateOption | undefined; responseContentType: string | undefined }> {
  const serializers = { ...config.serializer, ...requestConfig.serializer }
  const mediaTypes = { ...defaultMediaTypes, ...config.mediaTypes, ...requestConfig.mediaTypes }
  const onValidationError = requestConfig.onValidationError ?? config.onValidationError
  const validate = requestConfig.validate ?? config.validate
  const validationContext = { direction: 'request', method: requestConfig.method, url: requestConfig.url } as const

  const paramValues = {
    path: { ...(requestConfig.path as Record<string, unknown> | undefined) },
    query: { ...((requestConfig.query ?? requestConfig.params) as Record<string, unknown> | undefined) },
    headers: collectHeadersCaseInsensitive(config.headers, requestConfig.headers),
    cookies: requestConfig.cookies as Record<string, unknown> | undefined,
  }
  const [validatedPath, validatedQuery, validatedHeaders, validatedCookies] = await Promise.all(
    (['path', 'query', 'headers', 'cookies'] as const).map((source) =>
      runValidator({
        validator: isValidationEnabled(validate, 'params') && paramValues[source] !== undefined ? requestConfig.validator?.[source] : undefined,
        value: paramValues[source],
        context: { ...validationContext, source },
        onValidationError,
      }),
    ),
  )

  const headerValues = validatedHeaders as HeadersInit | undefined
  const headers = serializeHeaders(serializers.header ? serializers.header(headerValues, requestConfig.styles?.header) : headerValues)
  const contentType = requestConfig.contentType
  const { request: requestContentTypeOption, response: responseContentType } = typeof contentType === 'string' ? { request: contentType } : (contentType ?? {})
  if (responseContentType && getHeader(headers, 'accept') === undefined) {
    headers['Accept'] = responseContentType
  }

  const query: Record<string, unknown> = { ...(validatedQuery as Record<string, unknown> | undefined) }

  await resolveAuth({
    security: requestConfig.security,
    auth: requestConfig.auth ?? config.auth,
    headers,
    query,
  })

  const cookies = validatedCookies as Record<string, unknown> | undefined
  // An object with only nullish values sends nothing, so it needs no serializer.
  if (cookies && Object.values(cookies).some((value) => value !== undefined && value !== null)) {
    const cookie = requireSerializer(serializers, 'cookie')(cookies, requestConfig.styles?.cookie)
    if (cookie) appendCookie(headers, cookie)
  }

  const validatedBody = await runValidator({
    validator: isValidationEnabled(validate, 'request') ? requestConfig.validator?.request : undefined,
    value: requestConfig.body,
    context: { ...validationContext, source: 'body' },
    onValidationError,
  })
  const requestContentType = requestContentTypeOption ?? getHeader(headers, 'content-type') ?? (isEncodedBody(validatedBody) ? undefined : 'application/json')
  const body =
    // `null` is a valid JSON body, such as a merge patch that clears a resource.
    validatedBody === undefined
      ? undefined
      : resolveMediaType({ mediaTypes, contentType: requestContentType, use: 'encode' })?.encode?.(validatedBody, {
          contentType: requestContentType ?? '',
          signal: requestConfig.signal,
          config: requestConfig,
        })
  if (body !== undefined && requestContentType && getHeader(headers, 'content-type') !== requestContentType) {
    deleteHeader(headers, 'content-type')
    headers['Content-Type'] = requestContentType
  }
  // The transport sets the multipart boundary.
  if (body instanceof FormData) deleteHeader(headers, 'content-type')

  const url = serializeUrl({
    parts: [requestConfig.baseURL ?? config.baseURL, requestConfig.url],
    pathParams: (validatedPath ?? {}) as Record<string, unknown>,
    query,
    serializers,
    styles: requestConfig.styles,
  })

  const options = config.options || requestConfig.options ? { ...config.options, ...requestConfig.options } : undefined
  const accept = getHeader(headers, 'accept')

  return {
    mediaTypes,
    validate,
    responseContentType,
    request: {
      url,
      method: (requestConfig.method ?? 'GET').toUpperCase(),
      headers,
      body,
      signal: signalOf({ signal: requestConfig.signal, options }),
      credentials: requestConfig.credentials ?? config.credentials,
      options,
      stream:
        requestConfig.parseAs === 'stream' || Boolean(accept?.split(',').some((type) => resolveMediaType({ mediaTypes, contentType: type, use: 'stream' }))),
    },
  }
}

// A signal in `options` counts too, since every transport spreads `options` under the resolved fields.
function signalOf(config: { signal?: AbortSignal | undefined; options?: unknown }): AbortSignal | undefined {
  return config.signal ?? (config.options as { signal?: AbortSignal } | undefined)?.signal
}

async function* readItems({
  items,
  validateItem,
  signal,
}: {
  items: AsyncIterable<unknown>
  validateItem: (item: unknown) => unknown
  signal: AbortSignal | undefined
}): AsyncGenerator<unknown> {
  try {
    for await (const item of items) {
      yield await validateItem(item)
      if (signal?.aborted) throw signal.reason
    }
  } catch (error) {
    // A transport reports an abort in its own error type, such as axios's `CanceledError`.
    throw signal?.aborted ? signal.reason : error
  }
}

type InterceptorRuns<TRequest, TResponse> = {
  request: (value: ResolvedRequest, context?: RequestConfig<unknown, TRequest, TResponse>) => Promise<ResolvedRequest>
  response: (
    value: DecodedResponse<unknown, TRequest, TResponse>,
    context?: RequestConfig<unknown, TRequest, TResponse>,
  ) => Promise<DecodedResponse<unknown, TRequest, TResponse>>
  error: (value: Error, context?: RequestConfig<unknown, TRequest, TResponse>) => Promise<Error>
}

/**
 * Creates a client that sends through `defaultTransport`.
 */
export function createClientCore<TRequest = NativeRequest, TResponse = NativeResponse>(
  options: { defaultTransport: Transport<TRequest, TResponse>; parent?: InterceptorRuns<TRequest, TResponse> } & ClientConfig<TRequest, TResponse>,
): ClientInstance<TRequest, TResponse> {
  const { defaultTransport, parent, ...initialConfig } = options
  let config: ClientConfig<TRequest, TResponse> = { ...initialConfig }

  const own: Interceptors<TRequest, TResponse> = {
    request: createInterceptorStack(),
    response: createInterceptorStack(),
    error: createInterceptorStack(),
  }
  const run: InterceptorRuns<TRequest, TResponse> = {
    request: async (value, context) => own.request.run(parent ? await parent.request(value, context) : value, context),
    response: async (value, context) => own.response.run(parent ? await parent.response(value, context) : value, context),
    error: async (value, context) => own.error.run(parent ? await parent.error(value, context) : value, context),
  }

  async function send(requestConfig: RequestConfig<unknown, TRequest, TResponse> & EventStreamOptions, streaming: boolean) {
    const transport = requestConfig.transport ?? config.transport ?? defaultTransport
    // Read before the first await, so a `setConfig` during the call does not change it.
    const throwOnError = requestConfig.throwOnError ?? config.throwOnError ?? true
    const onValidationError = requestConfig.onValidationError ?? config.onValidationError
    const retry = resolveRetry(config.retry, requestConfig.retry)
    const { request, mediaTypes, validate, responseContentType } = await resolveRequest({ config, requestConfig })
    if (streaming) {
      request.stream = true
      // `client.stream` without a response content type would otherwise ask for the default, often JSON.
      if (getHeader(request.headers, 'accept') === undefined) request.headers['Accept'] = 'text/event-stream'
    }

    const resolvedRequest = await run.request(request, requestConfig)
    if (retry.limit > 0) resolvedRequest.retry = true
    const signal = signalOf(resolvedRequest)
    // A stream body, also one from Node or a generator, cannot be read twice.
    const oneShot = resolvedRequest.body instanceof ReadableStream || Symbol.asyncIterator in Object(resolvedRequest.body)
    // A method outside `methods` is not safe to send twice.
    const limit = retry.methods.includes(resolvedRequest.method.toUpperCase()) && !oneShot ? retry.limit : 0
    let retryCount = 0
    // A transport that answers with a bare `Response` gets the native request built for it.
    const toResult = (sent: Response | TransportResult<TRequest, TResponse>): TransportResult<TRequest, TResponse> =>
      isResponse(sent) ? { webResponse: sent, request: toNativeRequest(resolvedRequest) as TRequest, response: sent as TResponse & Response } : sent
    // Waits and resolves to true when the failed attempt may be sent again.
    const waitForRetry = async (failure: { response?: Response; error?: unknown }): Promise<boolean> => {
      const { response } = failure
      const serverDelay = retryAfter(response)
      // A `Retry-After` over a minute is the server saying to come back later, so the call gets the response.
      if (retryCount >= limit || signal?.aborted || (serverDelay ?? 0) > 60_000) return false
      // The hooks get a copy, so one that reads the body leaves it for the client.
      const copy = retry.shouldRetry || retry.onRetry ? response?.clone() : undefined
      const context: RetryContext = { ...failure, response: copy ?? response, request: resolvedRequest, retryCount: retryCount + 1 }
      const retryable = !response || retry.statusCodes.includes(response.status)
      // The call keeps the response only when a retry is turned down. A hook that throws releases it too.
      let kept = false
      let delay = 0
      try {
        if (!((await retry.shouldRetry?.(context)) ?? retryable)) {
          kept = true
          return false
        }
        retryCount++
        delay = serverDelay ?? retry.delay?.(retryCount) ?? backoff(retryCount)
        await retry.onRetry?.({ ...context, delay })
      } finally {
        release(copy)
        if (!kept) release(response)
      }
      await sleep(delay, signal)
      return true
    }
    const connect = async (): Promise<TransportResult<TRequest, TResponse>> => {
      while (true) {
        let sent: Response | TransportResult<TRequest, TResponse>
        try {
          sent = await transport(resolvedRequest)
        } catch (error) {
          if (await waitForRetry({ error })) continue
          throw error
        }
        const response = isResponse(sent) ? sent : sent.webResponse
        if ((response.status >= 200 && response.status < 300) || !(await waitForRetry({ response }))) return toResult(sent)
      }
    }
    const { webResponse, request: nativeRequest, response: nativeResponse } = await connect()

    const status = webResponse.status
    const isSuccess = status >= 200 && status < 300
    const header = webResponse.headers.get('Content-Type')
    const contentType = header ?? (isSuccess ? responseContentType : undefined) ?? '*/*'
    const cursor = { lastEventId: '', idSeen: false }
    const context: MediaTypeContext = { contentType, status, signal: resolvedRequest.signal, config: requestConfig, cursor }
    // With retries on, a stream handler may open a dropped stream again from its last event ID.
    if (limit > 0) {
      context.reopen = async ({ error, delivered }) => {
        // A stream that delivered again starts a new run of retries.
        if (delivered) retryCount = 0
        if (!(await waitForRetry({ error }))) throw error
        // Until the stream sends an `id`, the `Last-Event-ID` the caller sent stays. After that, an empty `id:` clears it.
        if (cursor.idSeen) deleteHeader(resolvedRequest.headers, 'last-event-id')
        if (cursor.lastEventId) resolvedRequest.headers['Last-Event-ID'] = cursor.lastEventId
        const { webResponse: response, request, response: native } = await connect()
        // A 204 tells the client to stop reconnecting.
        if (response.status === 204) return undefined
        const isOk = response.status >= 200 && response.status < 300
        // A reopen without a `Content-Type` takes the declared one, as the first response does.
        const reopened = response.headers.get('Content-Type') ?? contentType
        if (isOk && response.body && baseContentType(reopened) === baseContentType(contentType)) {
          context.status = response.status
          context.contentType = reopened
          return response.body
        }
        release(response)
        const type = baseContentType(response.headers.get('Content-Type'))
        const failure = isOk
          ? new TypeError(`Expected a streamed body, got ${type ?? 'a body without a content type'}`)
          : new ResponseError({
              data: undefined,
              status: response.status,
              statusText: response.statusText,
              contentType: type,
              headers: response.headers,
              request,
              response: native,
              method: resolvedRequest.method,
              url: resolvedRequest.url,
            })
        // Thrown while the caller iterates, so the error interceptors run here.
        throw await run.error(failure, requestConfig)
      }
    }
    const streamType = isSuccess ? resolveMediaType({ mediaTypes, contentType, use: 'stream' }) : undefined
    const decode = async (): Promise<unknown> => {
      if (isEmpty(webResponse, resolvedRequest.method)) return undefined
      if (streamType) return webResponse.body
      const parseAs = isSuccess ? requestConfig.parseAs : undefined
      if (parseAs && parseAs !== 'json') return readAs(webResponse, parseAs)
      // `parseAs: 'json'` uses the registered JSON handler, so a lenient one applies.
      return resolveMediaType({ mediaTypes, contentType: parseAs === 'json' ? 'application/json' : contentType, use: 'decode' })?.decode?.(webResponse, context)
    }

    const result = await run.response(
      {
        data: await decode().catch((error: unknown) => {
          if (error instanceof ValidationError) {
            error.direction = isSuccess ? 'response' : 'error'
            error.source = 'body'
            error.method = resolvedRequest.method
            error.status = status
          }
          throw error
        }),
        status,
        statusText: webResponse.statusText,
        headers: webResponse.headers,
        contentType: baseContentType(header),
        request: nativeRequest,
        response: nativeResponse,
      },
      requestConfig,
    )

    const validator = requestConfig.validator
    const resultSuccess = result.status >= 200 && result.status < 300
    const direction = resultSuccess ? 'response' : 'error'
    // The URL template, like a request failure gets: the resolved URL can carry an API key in its query.
    const validationContext = { direction, source: 'body', method: resolvedRequest.method, url: requestConfig.url, status: result.status } as const
    const validatorFor = isValidationEnabled(validate, direction)
      ? resultSuccess
        ? validator?.response
        : pickErrorValidator(validator?.error, result.status)
      : undefined
    const rawStream = result.data instanceof ReadableStream
    const readsItems = streaming && resultSuccess && streamType?.stream !== undefined && rawStream

    if (streaming && resultSuccess && !readsItems && result.data != null) {
      // Release the connection, since nobody reads this body.
      if (rawStream) await (result.data as ReadableStream).cancel().catch(() => {})
      // `cause` is set afterwards, since the constructor option needs the ES2022 library.
      const error: TypeError & { cause?: unknown } = new TypeError(`Expected a streamed body, got ${result.contentType ?? 'a body without a content type'}`)
      error.cause = result.data
      throw error
    }

    const data = rawStream ? result.data : await runValidator({ validator: validatorFor, value: result.data, context: validationContext, onValidationError })
    if (!resultSuccess && throwOnError) {
      throw new ResponseError({
        data,
        status: result.status,
        statusText: result.statusText,
        contentType: result.contentType,
        headers: result.headers,
        request: result.request,
        response: result.response,
        method: resolvedRequest.method,
        url: resolvedRequest.url,
      })
    }

    const validateItem = async (item: unknown) => {
      if (!validatorFor) return item
      const validate = (value: unknown) => runValidator({ validator: validatorFor, value, context: validationContext, onValidationError })
      if (requestConfig.eventShape === 'data') {
        const event = item as ServerSentEvent
        return { ...event, data: await validate(event.data) }
      }
      // Merged over the event, since the schema may not declare `id` and `retry`.
      if (requestConfig.eventShape === 'event') return { ...(item as object), ...((await validate(item)) as object) }
      return validate(item)
    }
    const items = readsItems && streamType?.stream && result.data instanceof ReadableStream ? streamType.stream(result.data, context) : undefined
    return {
      cursor,
      items: readItems({ items: items ?? emptyItems(), validateItem, signal: resolvedRequest.signal }),
      result: {
        status: result.status,
        data: resultSuccess ? data : undefined,
        error: resultSuccess
          ? undefined
          : data == null || data === ''
            ? ({ status: result.status, statusText: result.statusText } satisfies EmptyErrorBody)
            : data,
        contentType: result.contentType,
        headers: result.headers,
        request: result.request,
        response: result.response,
      },
    }
  }

  async function call<T>(requestConfig: RequestConfig<unknown, TRequest, TResponse>, work: () => Promise<T>): Promise<T> {
    const signal = signalOf(requestConfig)
    try {
      return await work()
    } catch (caught) {
      const error: unknown = signal?.aborted ? signal.reason : caught
      throw error instanceof Error ? await run.error(error, requestConfig) : error
    }
  }

  const client = (<TResponses, ThrowOnError extends boolean, THeaders>(requestConfig: RequestConfig<unknown, TRequest, TResponse>) =>
    call(
      requestConfig,
      async () => (await send(requestConfig, false)).result as RequestResult<TResponses, ThrowOnError, TRequest, TResponse, THeaders>,
    )) as ClientInstance<TRequest, TResponse>

  client.stream = <TResponses, ThrowOnError extends boolean, TItem, THeaders>(
    requestConfig: RequestConfig<unknown, TRequest, TResponse> & EventStreamOptions,
  ) =>
    call(requestConfig, async () => {
      const { result, items, cursor } = await send(requestConfig, true)
      const stream = items as AsyncGenerator<TItem>
      const streamed = {
        ...result,
        stream,
        data: result.error === undefined ? stream : undefined,
        get lastEventId() {
          return cursor.lastEventId
        },
        [Symbol.asyncIterator]: () => stream,
      }
      return streamed as unknown as StreamResult<TResponses, ThrowOnError, TItem, TRequest, TResponse, THeaders>
    })

  client.getConfig = () => config
  client.setConfig = (next) => {
    config = mergeConfig(config, next)
    return config
  }
  client.getUrl = (requestConfig) => {
    const query: Record<string, unknown> = { ...((requestConfig.query ?? requestConfig.params) as Record<string, unknown> | undefined) }
    return serializeUrl({
      parts: [requestConfig.baseURL ?? config.baseURL, requestConfig.url],
      pathParams: (requestConfig.path ?? {}) as Record<string, unknown>,
      query,
      serializers: { ...config.serializer, ...requestConfig.serializer },
      styles: requestConfig.styles,
    })
  }
  client.interceptors = own
  client.createClient = (next = {}) => createClientCore({ defaultTransport, ...mergeConfig(config, next) })
  client.extend = (next = {}) => createClientCore({ defaultTransport, parent: run, ...mergeConfig(config, next) })

  return client
}

async function* emptyItems(): AsyncGenerator<unknown> {}

/**
 * A client created on first use, so importing an operation runs no setup. Config set before that is passed to `create`.
 */
export function createLazyClient<TRequest = NativeRequest, TResponse = NativeResponse>(
  create: (config: ClientConfig<TRequest, TResponse>) => ClientInstance<TRequest, TResponse>,
): ClientInstance<TRequest, TResponse> {
  let instance: ClientInstance<TRequest, TResponse> | undefined
  let pending: ClientConfig<TRequest, TResponse> = {}
  const get = () => (instance ??= create(pending))

  const client = (<TResponses, ThrowOnError extends boolean>(requestConfig: RequestConfig<unknown, TRequest, TResponse> & { throwOnError?: ThrowOnError }) =>
    get()<TResponses, ThrowOnError>(requestConfig)) as ClientInstance<TRequest, TResponse>
  client.stream = (requestConfig) => get().stream(requestConfig)
  client.getConfig = () => instance?.getConfig() ?? pending
  client.setConfig = (next) => (instance ? instance.setConfig(next) : (pending = mergeConfig(pending, next)))
  client.getUrl = (requestConfig) => get().getUrl(requestConfig)
  client.createClient = (next) => get().createClient(next)
  client.extend = (next) => get().extend(next)
  Object.defineProperty(client, 'interceptors', { get: () => get().interceptors, enumerable: true })
  return client
}
