import ky from 'ky'
import type { KyInstance, Options as KyOptions } from 'ky'
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
 * Extra Ky options for a call or client, such as `retry`, `timeout`, or `hooks`. The left-out options would replace
 * the body or URL the core built, or its status handling. The intersection keeps the options assignable to
 * `RequestInit` under `exactOptionalPropertyTypes`.
 */
export type NativeOptions = Omit<KyOptions, 'json' | 'prefix' | 'searchParams' | 'throwHttpErrors'> & RequestInit

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

/**
 * Turns a Ky instance into a transport that keeps its defaults and hooks.
 */
export function createKyTransport(instance: KyInstance): Transport {
  // The core splits success from error and reads the body, so Ky must resolve every status with the body unread.
  // With the client's `retry` set, Ky's own retry is off, so the two do not multiply.
  return (request) => instance(request.url, { ...toRequestInit(request), throwHttpErrors: false, ...(request.retry ? { retry: 0 } : {}) })
}

// Ky retries by default. The client sends each call once unless `options.retry` asks for more.
export const defaultTransport: Transport = createKyTransport(ky.create({ retry: 0 }))

/**
 * The client every generated operation uses unless a call passes its own. It is created on first use.
 */
export const client: ClientInstance = createLazyClient((config) => createClientCore({ defaultTransport, ...config }))
client.setConfig(defaultConfig)

export const createClient: ClientInstance['createClient'] = client.createClient
