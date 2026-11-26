import type { Options } from '../../../.kubb/client'
import type { CreatePetsXEXAMPLEEnumKey } from '../../../models/ts/CreatePetsXEXAMPLEEnum'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'
import { createPetsResponseSchema, createPetsStatusDefaultSchema } from '../../../zod/pets/createPetsSchema'

/**
 * `POST /pets/{uuid}`
 * @summary Create a pet
 */
export function createPets<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body: {
        name: string
        tag: string
      }
      path: {
        uuid: string
      }
      query?: {
        bool_param?: true
        offset?: number
      }
      headers: {
        'X-EXAMPLE': CreatePetsXEXAMPLEEnumKey
      }
    },
    ThrowOnError
  >,
) {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<
      {
        '201': unknown
        default: unknown
      },
      ThrowOnError
    >({
      method: 'POST',
      url: '/pets/{uuid}',
      contentType: { request: 'application/json' },
      ...config,
      validator: { response: createPetsResponseSchema, error: { default: createPetsStatusDefaultSchema }, ...config.validator },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
