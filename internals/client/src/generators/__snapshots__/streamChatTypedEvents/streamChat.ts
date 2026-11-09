/* eslint-disable no-alert, no-console */

import type { StreamOptions, Unwrappable, StreamResult, SuccessOf, TypedEvent } from './.kubb/client'
import type { StreamChatOptions, StreamChatResponses } from './StreamChat'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

/**
 * `POST /chat`
 * @param options - Per-call settings, such as `client` and `throwOnError`.
 * @returns The stream result, whose `data` yields each item as it arrives.
 */
export function streamChat<ThrowOnError extends boolean = true>(
  options: StreamOptions<StreamChatOptions, ThrowOnError> = {},
): Unwrappable<StreamResult<StreamChatResponses, ThrowOnError, TypedEvent<SuccessOf<StreamChatResponses>>>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient.stream<StreamChatResponses, ThrowOnError, TypedEvent<SuccessOf<StreamChatResponses>>>({
      method: 'POST',
      url: '/chat',
      contentType: { response: 'text/event-stream' },
      eventShape: 'event',
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
