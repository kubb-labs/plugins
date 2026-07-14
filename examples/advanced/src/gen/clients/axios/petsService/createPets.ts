import type { Options, RequestResult } from '../../../.kubb/client'
import type { CreatePetsOptions, CreatePetsResponses } from '../../../models/ts/pets/CreatePets'
import { client } from '../../../.kubb/client'
import { createPetsResponseSchema, createPetsErrorSchema } from '../../../zod/pets/createPetsSchema'

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export function createPets<ThrowOnError extends boolean = true>(
  options: Options<CreatePetsOptions, ThrowOnError>,
): Promise<RequestResult<CreatePetsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'POST',
    url: '/pets/{uuid}',
    validator: { response: createPetsResponseSchema, error: createPetsErrorSchema },
    ...config,
  }) as Promise<RequestResult<CreatePetsResponses, ThrowOnError>>
}
