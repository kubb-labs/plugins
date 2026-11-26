/* eslint-disable no-alert, no-console */

import type { StreamOptions, SuccessOf, TypedEvent } from './.kubb/client'
import type { StreamChatOptions, StreamChatResponses } from './StreamChat'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

/**
 * `POST /chat`
 */
export function streamChat<ThrowOnError extends boolean = true>(options: StreamOptions<StreamChatOptions, ThrowOnError> = {}) {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient.stream<StreamChatResponses, ThrowOnError, TypedEvent<SuccessOf<StreamChatResponses>>>({
      method: 'POST',
      url: '/chat',
      contentType: { response: 'text/event-stream' },
      eventShape: 'event',
      rawData: true,
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
