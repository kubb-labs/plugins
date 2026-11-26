/* eslint-disable no-alert, no-console */

import type { StreamOptions, UnwrappedStreamResultWithHeaders, SuccessOf, ServerSentEvent } from './.kubb/client'
import type { StreamEventsOptions, StreamEventsResponses, StreamEventsStatus200Headers } from './StreamEvents'
import { client, unwrapResult, resolveThrowOnError } from './.kubb/client'

type StreamEventsResponseHeaders = { '200': StreamEventsStatus200Headers }

/**
 * `GET /events`
 */
export function streamEvents<ThrowOnError extends boolean = true>(
  options: StreamOptions<StreamEventsOptions, ThrowOnError> = {},
): Promise<UnwrappedStreamResultWithHeaders<StreamEventsResponses, StreamEventsResponseHeaders, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return unwrapResult(
    apiClient.stream<StreamEventsResponses, ThrowOnError, ServerSentEvent<SuccessOf<StreamEventsResponses>>, StreamEventsResponseHeaders>({
      method: 'GET',
      url: '/events',
      contentType: { response: 'text/event-stream' },
      eventShape: 'data',
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
    resolveThrowOnError(config.throwOnError, true),
  )
}
