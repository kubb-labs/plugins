/* eslint-disable no-alert, no-console */

import type { Options, SuccessOf } from './.kubb/client'
import type { EventStreamResult, EventStreamOptions, TypedEvent } from './.kubb/sse'
import type { StreamChatOptions, StreamChatResponses } from './StreamChat'
import { client } from './.kubb/client'
import { toEventStream } from './.kubb/sse'

/**
 * {@link /chat}
 */
export function streamChat<ThrowOnError extends boolean = true>(
  options: Options<StreamChatOptions, ThrowOnError> & EventStreamOptions = {},
): Promise<EventStreamResult<TypedEvent<SuccessOf<StreamChatResponses>>>> {
  const { client: request = client, ...config } = options

  return toEventStream<TypedEvent<SuccessOf<StreamChatResponses>>>(
    request({ method: 'POST', url: '/chat', responseType: 'stream', ...config, throwOnError: config.throwOnError ?? true }),
    { client: request, config, shape: 'event' },
  )
}
