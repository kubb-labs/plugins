import * as core from './core'
import { createClientCore, createLazyClient, toRequestInit } from './core'
export * from './core'

/**
 * The native request and response that every result and error carries.
 */
export type NativeRequest = Request
export type NativeResponse = Response

/**
 * Extra `fetch` init for a call or client, such as `cache`, `redirect`, or Next.js's `next`.
 */
export type NativeOptions = RequestInit & { next?: Record<string, unknown> }

// The core's types default to the natives of the `client.ts` next to it. Declaring them here gives them this client's natives
// when they are imported from the package too, where that file is the generic one from `@kubb/plugin-client`.
export type ResponseError<TError = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.ResponseError<TError, TRequest, TResponse>
export const ResponseError = core.ResponseError as {
  new <TError = unknown, TRequest = NativeRequest, TResponse = NativeResponse>(
    config: ConstructorParameters<typeof core.ResponseError<TError, TRequest, TResponse>>[0],
  ): core.ResponseError<TError, TRequest, TResponse>
  is: typeof core.ResponseError.is
  // `instanceof` narrows to this type, so it carries the native request and response.
  prototype: core.ResponseError<unknown, NativeRequest, NativeResponse>
}

export type RequestConfig<TBody = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.RequestConfig<TBody, TRequest, TResponse> & {
  options?: NativeOptions
}
export type Options<TData extends core.DataShape, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = core.Options<
  TData,
  ThrowOnError,
  TRequest,
  TResponse
> & { options?: NativeOptions }
export type ClientConfig<TRequest = NativeRequest, TResponse = NativeResponse> = core.ClientConfig<TRequest, TResponse> & { options?: NativeOptions }
export type ResolvedRequest = core.ResolvedRequest & { options?: NativeOptions }
export type RequestResult<TResponses, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = core.RequestResult<
  TResponses,
  ThrowOnError,
  TRequest,
  TResponse
>
export type UnwrappedResult<TResponses, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = core.UnwrappedResult<
  TResponses,
  ThrowOnError,
  TRequest,
  TResponse
>
export type ResponseErrorConfig<TError = unknown> = core.ResponseError<TError, NativeRequest, NativeResponse>
export type TransportResult<TRequest = NativeRequest, TResponse = NativeResponse> = core.TransportResult<TRequest, TResponse>
export type DecodedResponse<TData = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.DecodedResponse<TData, TRequest, TResponse>
export type Transport<TRequest = NativeRequest, TResponse = NativeResponse> = core.Transport<TRequest, TResponse>
export type Interceptors<TRequest = NativeRequest, TResponse = NativeResponse> = core.Interceptors<TRequest, TResponse>
export type ClientInstance<TRequest = NativeRequest, TResponse = NativeResponse> = core.ClientInstance<TRequest, TResponse>
export type StreamOptions<TData extends core.DataShape, ThrowOnError extends boolean = true> = Options<TData, ThrowOnError> & core.EventStreamOptions
export type StreamResult<
  TResponses,
  ThrowOnError extends boolean = true,
  TEvent = core.ServerSentEvent<core.SuccessOf<TResponses>>,
  TRequest = NativeRequest,
  TResponse = NativeResponse,
> = core.StreamResult<TResponses, ThrowOnError, TEvent, TRequest, TResponse>
export type UnwrappedStreamResult<TResponses, ThrowOnError extends boolean = true, TEvent = core.ServerSentEvent<core.SuccessOf<TResponses>>> = core.Unwrapped<
  StreamResult<TResponses, ThrowOnError, TEvent>,
  ThrowOnError
>
export type ResponseErrorOf<TResponses, TRequest = NativeRequest, TResponse = NativeResponse> = core.ResponseErrorOf<TResponses, TRequest, TResponse>
export const isResponseError = core.isResponseError as <TResponses = unknown, TRequest = NativeRequest, TResponse = NativeResponse>(
  error: unknown,
) => error is core.ResponseErrorOf<TResponses, TRequest, TResponse>

export const defaultTransport = async (request: core.ResolvedRequest): Promise<TransportResult> => {
  const nativeRequest = new Request(request.url, toRequestInit(request))
  // `Request` drops the non-standard `next` field, so Next.js reads it from the init.
  const { options } = request as ResolvedRequest
  const nextInit: NativeOptions | undefined = options?.next ? { next: options.next } : undefined
  const response = await globalThis.fetch(nativeRequest, nextInit)

  return { webResponse: response, request: nativeRequest, response }
}

/**
 * The client every generated operation uses unless a call passes its own. It is created on first use.
 */
export const client = createLazyClient<NativeRequest, NativeResponse>((config) => createClientCore({ defaultTransport, ...config }))

export const createClient = client.createClient
