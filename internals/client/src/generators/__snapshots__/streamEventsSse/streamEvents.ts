/* eslint-disable no-alert, no-console */

import type { Options, EventStreamResult, SuccessOf, ServerSentEvent } from './.kubb/client'
import type { StreamEventsOptions, StreamEventsResponses } from './StreamEvents'
import { client, toEventStream } from './.kubb/client'

/**
 * {@link /events}
 */
export function streamEvents<ThrowOnError extends boolean = true>(
  options: Options<StreamEventsOptions, ThrowOnError> = {},
): Promise<EventStreamResult<ServerSentEvent<SuccessOf<StreamEventsResponses>>>> {
  const { client: request = client, ...config } = options

  return toEventStream<ServerSentEvent<SuccessOf<StreamEventsResponses>>>(
    (init) => request({ method: 'GET', url: '/events', responseType: 'stream', ...config, throwOnError: config.throwOnError ?? true, ...init }),
    config,
    { method: 'GET', shape: 'data' },
  )
}
