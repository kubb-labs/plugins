/* eslint-disable no-alert, no-console */

import type { SuccessOf, Unwrappable } from './.kubb/client'
import type { StreamResult, StreamOptions, TypedEvent } from './.kubb/sse'
import type { StreamChatOptions, StreamChatResponses } from './StreamChat'
import { client, withUnwrap } from './.kubb/client'
import { toEventStream } from './.kubb/sse'

/**
 * `POST /chat`
 * @param options - Per-call settings, such as `client` and `throwOnError`.
 * @returns The stream result, whose `data` yields each item as it arrives.
 */
export function streamChat<ThrowOnError extends boolean = true>(
  options: StreamOptions<StreamChatOptions, ThrowOnError> = {},
): Unwrappable<StreamResult<StreamChatResponses, ThrowOnError, TypedEvent<SuccessOf<StreamChatResponses>>>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    toEventStream<TypedEvent<SuccessOf<StreamChatResponses>>>(
      request({
        method: 'POST',
        url: '/chat',
        contentType: { response: 'text/event-stream' },
        responseType: 'stream',
        ...config,
        throwOnError: config.throwOnError ?? true,
      }),
      { client: request, config, shape: 'event' },
    ) as Promise<StreamResult<StreamChatResponses, ThrowOnError, TypedEvent<SuccessOf<StreamChatResponses>>>>,
  )
}
