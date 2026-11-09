/* eslint-disable no-alert, no-console */

import type { StreamOptions, Unwrappable, StreamResult } from './.kubb/client'
import type { StreamEventsOptions, StreamEventsResponses } from './StreamEvents'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

/**
 * `GET /events`
 */
export function streamEvents<ThrowOnError extends boolean = true>(
  options: StreamOptions<StreamEventsOptions, ThrowOnError> = {},
): Unwrappable<StreamResult<StreamEventsResponses, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient.stream<StreamEventsResponses, ThrowOnError>({
      method: 'GET',
      url: '/events',
      baseURL: 'https://echo.websocket.org',
      contentType: { response: 'text/event-stream' },
      eventShape: 'data',
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
