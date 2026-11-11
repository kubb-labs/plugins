/* eslint-disable no-alert, no-console */

import type { StreamOptions, UnwrappedStreamResultWithHeaders, SuccessOf, ServerSentEvent } from './.kubb/client'
import type { StreamEventsOptions, StreamEventsResponses, StreamEventsStatus200Headers } from './StreamEvents'
import { client, unwrapResult, resolveThrowOnError } from './.kubb/client'

/**
 * `GET /events`
 */
export function streamEvents<ThrowOnError extends boolean = true>(
  options: StreamOptions<StreamEventsOptions, ThrowOnError> = {},
): Promise<UnwrappedStreamResultWithHeaders<StreamEventsResponses, { '200': StreamEventsStatus200Headers }, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return unwrapResult(
    apiClient.stream<StreamEventsResponses, ThrowOnError, ServerSentEvent<SuccessOf<StreamEventsResponses>>, { '200': StreamEventsStatus200Headers }>({
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
