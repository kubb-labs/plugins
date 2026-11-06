import type { Options, SuccessOf } from '../../../.kubb/client'
import type { EventStreamOptions, EventStreamResult } from '../../../.kubb/sse'
import type { PetEvent } from '../../../models/ts/PetEvent'
import { client } from '../../../.kubb/client'
import { toEventStream } from '../../../.kubb/sse'

/**
 * @description Server-Sent Events stream of changes for a single pet
 * @summary Stream pet changes
 * {@link /pet/:petId/events}
 */
export function streamPetEvents<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body?: never
      path: {
        petId: number
      }
      query?: never
      headers?: never
    },
    ThrowOnError
  > &
    EventStreamOptions,
): Promise<
  EventStreamResult<
    SuccessOf<{
      '200': PetEvent
    }>
  >
> {
  const { client: request = client, ...config } = options

  return toEventStream<
    SuccessOf<{
      '200': PetEvent
    }>
  >({
    send: (init) =>
      request({
        method: 'GET',
        url: '/pet/{petId}/events',
        security: [
          { type: 'apiKey', name: 'api_key', in: 'header' },
          { type: 'oauth2', scopes: ['read:pets'] },
        ],
        responseType: 'stream',
        ...config,
        throwOnError: config.throwOnError ?? true,
        ...init,
      }),
    config,
    method: 'GET',
    shape: 'data',
  })
}
