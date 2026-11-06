import type { SuccessOf } from '../../../.kubb/client'
import type { StreamResult, StreamOptions } from '../../../.kubb/sse'
import type { PetEvent } from '../../../models/ts/PetEvent'
import { client } from '../../../.kubb/client'
import { toEventStream } from '../../../.kubb/sse'

/**
 * @description Server-Sent Events stream of changes for a single pet
 * @summary Stream pet changes
 * {@link /pet/:petId/events}
 */
export function streamPetEvents<ThrowOnError extends boolean = true>(
  options: StreamOptions<
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
  StreamResult<
    SuccessOf<{
      '200': PetEvent
    }>,
    ThrowOnError
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
    { client: request, config, shape: 'data' },
  ) as Promise<
    StreamResult<
      SuccessOf<{
        '200': PetEvent
      }>,
      ThrowOnError
    >
  >
}
