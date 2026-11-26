import type { StreamOptions, Unwrappable, StreamResult } from '../../../.kubb/client'
import type { PetEvent } from '../../../models/ts/PetEvent'
import { client, withUnwrap, resolveThrowOnError, securitySchemes } from '../../../.kubb/client'

/**
 * `GET /pet/{petId}/events`
 * @description Server-Sent Events stream of changes for a single pet
 * @summary Stream pet changes
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
): Unwrappable<
  StreamResult<
    {
      '200': PetEvent
    },
    ThrowOnError
  >
> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient.stream<
      {
        '200': PetEvent
      },
      ThrowOnError
    >({
      method: 'GET',
      url: '/pet/{petId}/events',
      security: [securitySchemes.api_key, { ...securitySchemes.petstore_auth, scopes: ['read:pets'] }],
      contentType: { response: 'text/event-stream' },
      eventShape: 'data',
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
