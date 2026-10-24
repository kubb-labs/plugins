import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { CreatePetsBoolParamKey } from '../../../models/ts/CreatePetsBoolParam'
import type { CreatePetsXEXAMPLEKey } from '../../../models/ts/CreatePetsXEXAMPLE'
import type { PetNotFound } from '../../../models/ts/PetNotFound'
import { client, withUnwrap } from '../../../.kubb/client'
import { createPetsResponseSchema, createPetsErrorSchema } from '../../../zod/pets/createPetsSchema'

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
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
        bool_param?: CreatePetsBoolParamKey
        offset?: number
      }
      headers: {
        'X-EXAMPLE': CreatePetsXEXAMPLEKey
      }
    },
    ThrowOnError
  >,
): Unwrappable<
  RequestResult<
    {
      '201': unknown
      default: PetNotFound
    },
    ThrowOnError
  >
> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'POST',
      url: '/pets/{uuid}',
      validator: { response: createPetsResponseSchema, error: createPetsErrorSchema },
      ...config,
      throwOnError: config.throwOnError ?? true,
    }) as Promise<
      RequestResult<
        {
          '201': unknown
          default: PetNotFound
        },
        ThrowOnError
      >
    >,
  )
}
