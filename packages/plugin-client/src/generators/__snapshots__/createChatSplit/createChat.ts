/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult, StreamOptions, StreamResult, SuccessOf, TypedEvent } from './.kubb/client'
import type { CreateChatOptions, CreateChatResponses, CreateChatStatus200Json, CreateChatStatus200EventStream } from './CreateChat'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

type OmitStreamField<T> = T extends unknown
  ? { [K in keyof T]: K extends 'body' ? (T[K] extends infer B ? (B extends object ? Omit<B, 'stream'> : B) : never) : T[K] }
  : never

/**
 * `POST /chat/completions`
 */
export function createChat<ThrowOnError extends boolean = true>(
  options: Options<OmitStreamField<CreateChatOptions>, ThrowOnError>,
): Unwrappable<RequestResult<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200Json }, ThrowOnError>> {
  const { client: apiClient = client, contentType, ...config } = options

  return withUnwrap(
    apiClient<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200Json }, ThrowOnError>({
      method: 'POST',
      url: '/chat/completions',
      contentType: { request: 'application/json', response: 'application/json', ...(typeof contentType === 'string' ? { request: contentType } : contentType) },
      ...config,
      body: { ...config.body, stream: false },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}

/**
 * `POST /chat/completions`
 */
export function createChatStream<ThrowOnError extends boolean = true>(
  options: StreamOptions<OmitStreamField<CreateChatOptions>, ThrowOnError>,
): Unwrappable<
  StreamResult<
    Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream },
    ThrowOnError,
    TypedEvent<SuccessOf<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream }>>
  >
> {
  const { client: apiClient = client, contentType, ...config } = options

  return withUnwrap(
    apiClient.stream<
      Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream },
      ThrowOnError,
      TypedEvent<SuccessOf<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream }>>
    >({
      method: 'POST',
      url: '/chat/completions',
      contentType: {
        request: 'application/json',
        response: 'text/event-stream',
        ...(typeof contentType === 'string' ? { request: contentType } : contentType),
      },
      eventShape: 'event',
      rawData: true,
      ...config,
      body: { ...config.body, stream: true },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
