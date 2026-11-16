/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult, StreamOptions, StreamResult, SuccessOf, TypedEvent } from './.kubb/client'
import type { CreateChatOptions, CreateChatResponses, CreateChatStatus200Json, CreateChatStatus200EventStream } from './CreateChat'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

/**
 * `POST /chat/completions`
 */
export function createChat<ThrowOnError extends boolean = true>(
  options: Options<Omit<CreateChatOptions, 'body'> & { body: Omit<NonNullable<CreateChatOptions['body']>, 'stream'> }, ThrowOnError>,
): Unwrappable<RequestResult<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200Json }, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200Json }, ThrowOnError>({
      method: 'POST',
      url: '/chat/completions',
      contentType: { request: 'application/json' },
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
  options: StreamOptions<Omit<CreateChatOptions, 'body'> & { body: Omit<NonNullable<CreateChatOptions['body']>, 'stream'> }, ThrowOnError>,
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
