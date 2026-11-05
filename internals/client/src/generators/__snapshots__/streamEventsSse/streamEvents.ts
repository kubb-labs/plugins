/* eslint-disable no-alert, no-console */

import type { Options, SuccessOf } from './.kubb/client'
import type { EventStreamOptions, EventStreamResult, ServerSentEvent } from './.kubb/sse'
import type { StreamEventsOptions, StreamEventsResponses } from './StreamEvents'
import { client } from './.kubb/client'
import { toEventStream } from './.kubb/sse'

/**
 * {@link /events}
 */
export function streamEvents<ThrowOnError extends boolean = true>(
  options: Options<StreamEventsOptions, ThrowOnError> & EventStreamOptions = {},
): Promise<EventStreamResult<ServerSentEvent<SuccessOf<StreamEventsResponses>>>> {
  const { client: request = client, ...config } = options

  return toEventStream<ServerSentEvent<SuccessOf<StreamEventsResponses>>>(
    (init) => request({ method: 'GET', url: '/events', responseType: 'stream', ...config, throwOnError: config.throwOnError ?? true, ...init }),
    config,
    { method: 'GET', shape: 'data' },
  )
}
