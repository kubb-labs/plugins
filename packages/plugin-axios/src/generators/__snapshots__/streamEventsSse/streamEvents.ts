/* eslint-disable no-alert, no-console */

import type { Options, EventStreamResult, SuccessOf } from './.kubb/client.ts'
import type { StreamEventsOptions, StreamEventsResponses } from './StreamEvents.ts'
import { client, toEventStream } from './.kubb/client.ts'

/**
 * {@link /events}
 */
export function streamEvents<ThrowOnError extends boolean = true>(
  options: Options<StreamEventsOptions, ThrowOnError> = {},
): Promise<EventStreamResult<SuccessOf<StreamEventsResponses>>> {
  const { client: request = client, ...config } = options

  return toEventStream<SuccessOf<StreamEventsResponses>>(request({ method: 'GET', url: '/events', responseType: 'stream', ...config }))
}
