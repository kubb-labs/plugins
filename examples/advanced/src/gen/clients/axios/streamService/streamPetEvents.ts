import type { Options, EventStreamResult, SuccessOf } from '../../../.kubb/client'
import type { StreamPetEventsOptions, StreamPetEventsResponses } from '../../../models/ts/stream/StreamPetEvents'
import { client, toEventStream } from '../../../.kubb/client'

/**
 * @description Server-Sent Events stream of changes for a single pet
 * @summary Stream pet changes
 * {@link /pet/:petId/events}
 */
export function streamPetEvents<ThrowOnError extends boolean = true>(
  options: Options<StreamPetEventsOptions, ThrowOnError>,
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
