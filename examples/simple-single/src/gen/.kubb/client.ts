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

export const defaultTransport = async (request: core.ResolvedRequest): Promise<TransportResult> => {
  const nativeRequest = new Request(request.url, toRequestInit(request))
  // `Request` drops the non-standard `next` field, so Next.js reads it from the init.
  const nextInit: NativeOptions | undefined = request.options?.next ? { next: request.options.next } : undefined
  const response = await globalThis.fetch(nativeRequest, nextInit)

  return { webResponse: response, request: nativeRequest, response }
}

/**
 * The client every generated operation uses unless a call passes its own. It is created on first use.
 */
export const client = createLazyClient((config) => createClientCore({ defaultTransport, ...config }))

export const createClient = client.createClient

import { urlencoded } from './mediaTypes/urlencoded.ts'
import { serializeQuery } from './serializers/queryStyles.ts'
client.setConfig({ mediaTypes: { 'application/x-www-form-urlencoded': urlencoded }, serializer: { query: serializeQuery } })
/**
 * The security schemes from the spec by name. A generated call sends one of them to the `auth` resolver.
 */
export const securitySchemes = {
  petstore_auth: { type: 'oauth2', flows: { implicit: { authorizationUrl: 'https://petstore3.swagger.io/oauth/authorize' } } },
  api_key: { type: 'apiKey', name: 'api_key', in: 'header' },
} as const
