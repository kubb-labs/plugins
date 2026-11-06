/* eslint-disable no-alert, no-console */

import type { Options, SuccessOf } from './.kubb/client'
import type { EventStreamResult, EventStreamOptions } from './.kubb/sse'
import type { StreamEventsOptions, StreamEventsResponses } from './StreamEvents'
import { client } from './.kubb/client'
import { toEventStream } from './.kubb/sse'

/**
 * {@link /events}
 */
export function streamEvents<ThrowOnError extends boolean = true>(
  options: Options<StreamEventsOptions, ThrowOnError> & EventStreamOptions = {},
): Promise<EventStreamResult<SuccessOf<StreamEventsResponses>>> {
  const { client: request = client, ...config } = options

  return toEventStream<SuccessOf<StreamEventsResponses>>(
    request({ method: 'GET', url: '/events', responseType: 'stream', ...config, throwOnError: config.throwOnError ?? true }),
    { client: request, config, shape: 'data' },
  )
}
