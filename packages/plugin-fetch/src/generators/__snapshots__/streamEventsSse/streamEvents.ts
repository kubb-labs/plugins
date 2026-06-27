/* eslint-disable no-alert, no-console */

import type { Options, EventStreamResult, SuccessOf } from './.kubb/client'
import type { StreamEventsRequestConfig, StreamEventsResponses } from './StreamEvents'
import { client, toEventStream } from './.kubb/client'

/**
 * {@link /events}
 */
export function streamEvents<ThrowOnError extends boolean = true>(
  options: Options<StreamEventsRequestConfig, ThrowOnError>,
): Promise<EventStreamResult<SuccessOf<StreamEventsResponses>>> {
  const { client: request = client, ...config } = options

  return toEventStream<SuccessOf<StreamEventsResponses>>(request({ method: 'GET', url: '/events', responseType: 'stream', ...config }))
}
