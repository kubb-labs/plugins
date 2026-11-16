/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult, StreamOptions, StreamResult, SuccessOf, TypedEvent } from './.kubb/client'
import type { CreateChatOptions, CreateChatResponses, CreateChatStatus200Json, CreateChatStatus200EventStream } from './CreateChat'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

/**
 * `POST /chat/completions`
 */
export function createChat<ThrowOnError extends boolean = true>(
  options: StreamOptions<CreateChatOptions, ThrowOnError> & { stream: true },
): Unwrappable<
  StreamResult<
    Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream },
    ThrowOnError,
    TypedEvent<SuccessOf<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream }>>
  >
>
export function createChat<ThrowOnError extends boolean = true>(
  options?: Options<CreateChatOptions, ThrowOnError> & { stream?: false },
): Unwrappable<RequestResult<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200Json }, ThrowOnError>>
export function createChat<ThrowOnError extends boolean = true>(
  options: (StreamOptions<CreateChatOptions, ThrowOnError> & { stream: true }) | (Options<CreateChatOptions, ThrowOnError> & { stream?: false }) = {},
):
  | Unwrappable<
      StreamResult<
        Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream },
        ThrowOnError,
        TypedEvent<SuccessOf<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream }>>
      >
    >
  | Unwrappable<RequestResult<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200Json }, ThrowOnError>> {
  const { client: apiClient = client, stream, ...config } = options

  if (stream) {
    return withUnwrap(
      apiClient.stream<
        Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream },
        ThrowOnError,
        TypedEvent<SuccessOf<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream }>>
      >({
        method: 'POST',
        url: '/chat/completions',
        contentType: { response: 'text/event-stream' },
        eventShape: 'event',
        rawData: true,
        ...config,
        throwOnError: resolveThrowOnError(config.throwOnError, true),
      }),
    )
  }

  return withUnwrap(
    apiClient<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200Json }, ThrowOnError>({
      method: 'POST',
      url: '/chat/completions',
      contentType: { response: 'application/json' },
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
