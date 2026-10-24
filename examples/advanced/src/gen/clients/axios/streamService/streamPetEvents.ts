import type { Options, EventStreamResult, SuccessOf } from '../../../.kubb/client'
import type { PetEvent } from '../../../models/ts/PetEvent'
import { client, toEventStream } from '../../../.kubb/client'

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
  >,
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
  >(
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
    }),
  )
}
