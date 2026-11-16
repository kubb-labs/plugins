/* eslint-disable no-alert, no-console */

import type { CreateChatOptions, CreateChatResponses, CreateChatStatus200Json, CreateChatStatus200EventStream } from './CreateChat'
import type { Options, RequestResult, StreamResult, SuccessOf, TypedEvent } from '@acme/api-client'
import { client } from '@acme/api-client'

type OmitStreamField<T> = T extends unknown
  ? { [K in keyof T]: K extends 'body' ? (T[K] extends infer B ? (B extends object ? Omit<B, 'stream'> : B) : never) : T[K] }
  : never

/**
 * `POST /chat/completions`
 */
export function createChat<ThrowOnError extends boolean = true>(
  options: Options<OmitStreamField<CreateChatOptions>, ThrowOnError> & { stream: true },
): Promise<
  StreamResult<
    Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream },
    ThrowOnError,
    TypedEvent<SuccessOf<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream }>>
  >
>
export function createChat<ThrowOnError extends boolean = true>(
  options: Options<OmitStreamField<CreateChatOptions>, ThrowOnError> & { stream?: false },
): Promise<RequestResult<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200Json }, ThrowOnError>>
export function createChat<ThrowOnError extends boolean = true>(
  options:
    | (Options<OmitStreamField<CreateChatOptions>, ThrowOnError> & { stream: true })
    | (Options<OmitStreamField<CreateChatOptions>, ThrowOnError> & { stream?: false }),
):
  | Promise<
      StreamResult<
        Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream },
        ThrowOnError,
        TypedEvent<SuccessOf<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200EventStream }>>
      >
    >
  | Promise<RequestResult<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200Json }, ThrowOnError>> {
  const { client: apiClient = client, stream, contentType, ...config } = options

  if (stream) {
    return apiClient.stream<
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
      body: typeof config.body === 'string' ? config.body : { ...config.body, stream: true },
      throwOnError: config.throwOnError ?? true,
    })
  }

  return apiClient<Omit<CreateChatResponses, '200'> & { '200': CreateChatStatus200Json }, ThrowOnError>({
    method: 'POST',
    url: '/chat/completions',
    contentType: { request: 'application/json', response: 'application/json', ...(typeof contentType === 'string' ? { request: contentType } : contentType) },
    ...config,
    body: typeof config.body === 'string' ? config.body : { ...config.body, stream: false },
    throwOnError: config.throwOnError ?? true,
  })
}
