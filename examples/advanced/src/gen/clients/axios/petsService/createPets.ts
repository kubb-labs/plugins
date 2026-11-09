import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { CreatePetsBoolParamKey } from '../../../models/ts/CreatePetsBoolParam'
import type { CreatePetsXEXAMPLEKey } from '../../../models/ts/CreatePetsXEXAMPLE'
import { client, withUnwrap } from '../../../.kubb/client'
import { createPetsResponseSchema, createPetsStatusDefaultSchema } from '../../../zod/pets/createPetsSchema'

/**
 * `POST /pets/{uuid}`
 * @summary Create a pet
 * @param options - The request (`path`, `query`, `body`, `headers`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The result with `data` or `error`, `status`, `request`, and `response`.
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
      default: unknown
    },
    ThrowOnError
  >
> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'POST',
      url: '/pets/{uuid}',
      contentType: { request: 'application/json' },
      ...config,
      validator: { response: createPetsResponseSchema, error: { default: createPetsStatusDefaultSchema }, ...config.validator },
      throwOnError: config.throwOnError ?? true,
    }) as Promise<
      RequestResult<
        {
          '201': unknown
          default: unknown
        },
        ThrowOnError
      >
    >,
  )
}
