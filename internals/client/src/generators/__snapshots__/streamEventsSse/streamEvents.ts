/* eslint-disable no-alert, no-console */

import type { SuccessOf, Unwrappable } from './.kubb/client'
import type { StreamResult, StreamOptions, ServerSentEvent } from './.kubb/sse'
import type { StreamEventsOptions, StreamEventsResponses } from './StreamEvents'
import { client, withUnwrap } from './.kubb/client'
import { toEventStream } from './.kubb/sse'

/**
 * {@link /events}
 */
export function streamEvents<ThrowOnError extends boolean = true>(
  options: StreamOptions<StreamEventsOptions, ThrowOnError> = {},
): Unwrappable<StreamResult<StreamEventsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    toEventStream<ServerSentEvent<SuccessOf<StreamEventsResponses>>>(
      request({ method: 'GET', url: '/events', responseType: 'stream', ...config, throwOnError: config.throwOnError ?? true }),
      { client: request, config, shape: 'data' },
    ) as Promise<StreamResult<StreamEventsResponses, ThrowOnError>>,
  )
}
