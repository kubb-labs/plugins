/* eslint-disable no-alert, no-console */

import type { Options, EventStreamResult, SuccessOf, EventOf } from './.kubb/client'
import type { StreamChatOptions, StreamChatResponses } from './StreamChat'
import { client, toEventStream } from './.kubb/client'

/**
 * {@link /chat}
 */
export function streamChat<ThrowOnError extends boolean = true>(
  options: Options<StreamChatOptions, ThrowOnError> = {},
): Promise<EventStreamResult<EventOf<SuccessOf<StreamChatResponses>>>> {
  const { client: request = client, ...config } = options

  return toEventStream<EventOf<SuccessOf<StreamChatResponses>>>(
    (init) => request({ method: 'POST', url: '/chat', responseType: 'stream', ...config, throwOnError: config.throwOnError ?? true, ...init }),
    config,
    { method: 'POST', shape: 'event', events: ['message_delta', 'ping'] },
  )
}
