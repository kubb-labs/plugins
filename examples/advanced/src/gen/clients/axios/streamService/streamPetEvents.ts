import type { Options, EventStreamResult, SuccessOf } from '../../../.kubb/client.ts'
import type { StreamPetEventsRequestConfig, StreamPetEventsResponses } from '../../../models/ts/stream/StreamPetEvents.ts'
import { client, toEventStream } from '../../../.kubb/client.ts'

/**
 * @description Server-Sent Events stream of changes for a single pet
 * @summary Stream pet changes
 * {@link /pet/:petId/events}
 */
export function streamPetEvents<ThrowOnError extends boolean = true>(
  options: Options<StreamPetEventsRequestConfig, ThrowOnError>,
): Promise<EventStreamResult<SuccessOf<StreamPetEventsResponses>>> {
  const { client: request = client, ...config } = options

  return toEventStream<SuccessOf<StreamPetEventsResponses>>(
    request({
      method: 'GET',
      url: '/pet/{petId}/events',
      security: [{ type: 'apiKey', name: 'api_key', in: 'header' }, { type: 'oauth2' }],
      responseType: 'stream',
      ...config,
    }),
  )
}
