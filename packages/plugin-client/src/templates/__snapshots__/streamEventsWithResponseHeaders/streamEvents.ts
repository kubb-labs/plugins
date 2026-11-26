/* eslint-disable no-alert, no-console */

import type { StreamOptions, Unwrappable, StreamResultWithHeaders, SuccessOf, ServerSentEvent } from './.kubb/client'
import type { StreamEventsOptions, StreamEventsResponses, StreamEventsStatus200Headers } from './StreamEvents'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

type StreamEventsResponseHeaders = { '200': StreamEventsStatus200Headers }

/**
 * `GET /events`
 */
export function streamEvents<ThrowOnError extends boolean = true>(
  options: StreamOptions<StreamEventsOptions, ThrowOnError> = {},
): Unwrappable<StreamResultWithHeaders<StreamEventsResponses, StreamEventsResponseHeaders, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap<StreamResultWithHeaders<StreamEventsResponses, StreamEventsResponseHeaders, ThrowOnError>>(
    apiClient.stream<StreamEventsResponses, ThrowOnError, ServerSentEvent<SuccessOf<StreamEventsResponses>>, StreamEventsResponseHeaders>({
      method: 'GET',
      url: '/events',
      contentType: { response: 'text/event-stream' },
      eventShape: 'data',
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
