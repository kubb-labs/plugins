import ky from 'ky'
import type { AfterResponseHook, KyInstance, Options as KyOptions } from 'ky'
import { createClientCore, createLazyClient, toRequestInit } from './core.ts'
import { defaultConfig } from './config.ts'
import * as core from './core.ts'

export * from './core.ts'

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

// Ky only retries a status it throws on, and a thrown `HTTPError` has read the body. This hook retries by Ky's own
// `retry` options and hands the last response back unread.
// shortcut: retries after Ky's `retry.delay` and ignores a `Retry-After` header, pass `ky.retry({ delay })` from an own hook when a server needs it.
const retryStatus: AfterResponseHook = ({ request, response, options, retryCount }) => {
  const { limit, methods, statusCodes } = options.retry
  return retryCount < limit && statusCodes.includes(response.status) && methods.includes(request.method.toLowerCase()) ? ky.retry() : undefined
}

/**
 * Turns a Ky instance into a transport that keeps its defaults, retries, and hooks.
 */
export function createKyTransport(instance: KyInstance): Transport {
  return (request) => {
    const init = toRequestInit(request) as KyOptions
    // The core splits success from error and reads the body, so Ky must resolve every status with the body unread.
    return instance(request.url, {
      ...init,
      throwHttpErrors: false,
      hooks: { ...init.hooks, afterResponse: [...(init.hooks?.afterResponse ?? []), retryStatus] },
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
