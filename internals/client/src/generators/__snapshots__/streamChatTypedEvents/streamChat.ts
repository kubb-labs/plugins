/* eslint-disable no-alert, no-console */

import type { SuccessOf } from './.kubb/client'
import type { StreamResult, StreamOptions, TypedEvent } from './.kubb/sse'
import type { StreamChatOptions, StreamChatResponses } from './StreamChat'
import { client } from './.kubb/client'
import { toEventStream } from './.kubb/sse'

/**
 * {@link /chat}
 */
export function streamChat<ThrowOnError extends boolean = true>(
  options: StreamOptions<StreamChatOptions, ThrowOnError> = {},
): Promise<StreamResult<StreamChatResponses, ThrowOnError, TypedEvent<SuccessOf<StreamChatResponses>>>> {
  const { client: request = client, ...config } = options

  return toEventStream<TypedEvent<SuccessOf<StreamChatResponses>>>(
    request({ method: 'POST', url: '/chat', responseType: 'stream', ...config, throwOnError: config.throwOnError ?? true }),
    { client: request, config, shape: 'event' },
  ) as Promise<StreamResult<StreamChatResponses, ThrowOnError, TypedEvent<SuccessOf<StreamChatResponses>>>>
}
