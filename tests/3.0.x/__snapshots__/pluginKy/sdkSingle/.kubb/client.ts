import * as core from './core'
import ky from 'ky'
import type { AfterResponseHook, KyInstance, Options as KyOptions } from 'ky'
import { defaultConfig } from './config'
import { createClientCore, createLazyClient, toRequestInit } from './core'
import { HTTPError } from 'ky'
export * from './core'

/**
 * The native request and response that every result and error carries.
 */
export type NativeRequest = Request
export type NativeResponse = Response

/**
 * Extra Ky options for a call or client, such as `retry`, `timeout`, or `hooks`.
 */
// The intersection keeps the options assignable to `RequestInit` under `exactOptionalPropertyTypes`.
export type NativeOptions = KyOptions & RequestInit

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
export type RequestResult<
  TResponses,
  ThrowOnError extends boolean = true,
  TRequest = NativeRequest,
  TResponse = NativeResponse,
  THeaders = unknown,
> = core.RequestResult<TResponses, ThrowOnError, TRequest, TResponse, THeaders>
export type UnwrappedResult<
  TResponses,
  ThrowOnError extends boolean = true,
  TRequest = NativeRequest,
  TResponse = NativeResponse,
  THeaders = unknown,
> = core.UnwrappedResult<TResponses, ThrowOnError, TRequest, TResponse, THeaders>
export type ResponseErrorConfig<TError = unknown> = core.ResponseError<TError, NativeRequest, NativeResponse>
export type TransportResult<TRequest = NativeRequest, TResponse = NativeResponse> = core.TransportResult<TRequest, TResponse>
export type DecodedResponse<TData = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.DecodedResponse<TData, TRequest, TResponse>
export type Transport<TRequest = NativeRequest, TResponse = NativeResponse> = core.Transport<TRequest, TResponse>
export type Interceptors<TRequest = NativeRequest, TResponse = NativeResponse> = core.Interceptors<TRequest, TResponse>
export type ClientInstance<TRequest = NativeRequest, TResponse = NativeResponse> = core.ClientInstance<TRequest, TResponse>
export type StreamResult<
  TResponses,
  ThrowOnError extends boolean = true,
  TEvent = core.ServerSentEvent<core.SuccessOf<TResponses>>,
  TRequest = NativeRequest,
  TResponse = NativeResponse,
  THeaders = unknown,
> = core.StreamResult<TResponses, ThrowOnError, TEvent, TRequest, TResponse, THeaders>
export type ResponseErrorOf<TResponses, TRequest = NativeRequest, TResponse = NativeResponse, THeaders = unknown> = core.ResponseErrorOf<
  TResponses,
  TRequest,
  TResponse,
  THeaders
>
export const isResponseError = core.isResponseError as <TResponses = unknown, TRequest = NativeRequest, TResponse = NativeResponse, THeaders = unknown>(
  error: unknown,
) => error is ResponseErrorOf<TResponses, TRequest, TResponse, THeaders>

// The delay a `Retry-After` header asks for, in milliseconds: a number of seconds, or an HTTP date.
function retryAfter(response: Response): number | undefined {
  const value = response.headers.get('Retry-After')
  if (!value) return undefined
  const delay = /^\d+$/.test(value) ? Number(value) * 1000 : Date.parse(value) - Date.now()
  return Number.isNaN(delay) ? undefined : Math.max(0, delay)
}

// Ky only retries a status it throws on, and a thrown `HTTPError` has read the body. This hook makes the same
// decision from Ky's `retry` options and hands the last response back unread.
const retryStatus: AfterResponseHook = async ({ request, response, options, retryCount }) => {
  const { limit, methods, statusCodes, afterStatusCodes, maxRetryAfter, shouldRetry } = options.retry
  if (response.ok || retryCount >= limit || !methods.includes(request.method.toLowerCase())) return undefined

  // `shouldRetry` overrides the status check with `true` and vetoes the retry with `false`, as in Ky.
  const verdict = await shouldRetry?.({ error: new HTTPError(response, request, options), retryCount: retryCount + 1 })
  if (verdict === false || (verdict !== true && !statusCodes.includes(response.status))) return undefined

  const delay = afterStatusCodes.includes(response.status) ? retryAfter(response) : undefined
  if (delay !== undefined) return ky.retry({ delay: Math.min(maxRetryAfter, delay) })
  // A 413 without a `Retry-After` is permanent.
  return verdict !== true && response.status === 413 ? undefined : ky.retry()
}

/**
 * Turns a Ky instance into a transport that keeps its defaults, retries, and hooks.
 */
export function createKyTransport(instance: KyInstance): Transport {
  return (request) => {
    const hooks = request.options?.hooks
    // The core splits success from error and reads the body, so Ky must resolve every status with the body unread.
    return instance(request.url, {
      ...toRequestInit(request),
      throwHttpErrors: false,
      hooks: { ...hooks, afterResponse: [...(hooks?.afterResponse ?? []), retryStatus] },
    })
  }
}

export const defaultTransport: Transport = createKyTransport(ky)

/**
 * The client every generated operation uses unless a call passes its own. It is created on first use.
 */
export const client: ClientInstance = createLazyClient((config) => createClientCore({ defaultTransport, ...config }))
client.setConfig(defaultConfig)

export const createClient: ClientInstance['createClient'] = client.createClient

/**
 * The security schemes from the spec by name. A generated call sends one of them to the `auth` resolver.
 */
export const securitySchemes = { petstore_auth: { type: 'oauth2', flows: { implicit: { authorizationUrl: 'https://petstore3.swagger.io/oauth/authorize' } } }, api_key: { type: 'apiKey', name: 'api_key', in: 'header' } } as const
