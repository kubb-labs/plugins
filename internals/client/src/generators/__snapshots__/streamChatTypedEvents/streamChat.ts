/* eslint-disable no-alert, no-console */

import type { Options, SuccessOf } from './.kubb/client'
import type { EventStreamOptions, EventStreamResult, EventOf } from './.kubb/sse'
import type { StreamChatOptions, StreamChatResponses } from './StreamChat'
import { client } from './.kubb/client'
import { toEventStream } from './.kubb/sse'

/**
 * {@link /chat}
 */
export function streamChat<ThrowOnError extends boolean = true>(
  options: Options<StreamChatOptions, ThrowOnError> & EventStreamOptions = {},
): Promise<EventStreamResult<EventOf<SuccessOf<StreamChatResponses>>>> {
  const { client: request = client, ...config } = options

  return toEventStream<EventOf<SuccessOf<StreamChatResponses>>>({
    send: (init) => request({ method: 'POST', url: '/chat', responseType: 'stream', ...config, throwOnError: config.throwOnError ?? true, ...init }),
    config,
    method: 'POST',
    shape: 'event',
    events: ['message_delta', 'ping'],
  })
}
