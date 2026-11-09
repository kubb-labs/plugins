/* eslint-disable no-alert, no-console */

import type { SuccessOf, Unwrappable } from './.kubb/client'
import type { StreamResult, StreamOptions, ServerSentEvent } from './.kubb/sse'
import type { StreamEventsOptions, StreamEventsResponses } from './StreamEvents'
import { client, withUnwrap } from './.kubb/client'
import { toEventStream } from './.kubb/sse'

/**
 * `GET /events`
 * @param options - Per-call settings, such as `client` and `throwOnError`.
 * @returns The stream result, whose `data` yields each item as it arrives.
 */
export function streamEvents<ThrowOnError extends boolean = true>(
  options: StreamOptions<StreamEventsOptions, ThrowOnError> = {},
): Unwrappable<StreamResult<StreamEventsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    toEventStream<ServerSentEvent<SuccessOf<StreamEventsResponses>>>(
      request({
        method: 'GET',
        url: '/events',
        contentType: { response: 'text/event-stream' },
        responseType: 'stream',
        ...config,
        throwOnError: config.throwOnError ?? true,
      }),
      { client: request, config, shape: 'data' },
    ) as Promise<StreamResult<StreamEventsResponses, ThrowOnError>>,
  )
}
