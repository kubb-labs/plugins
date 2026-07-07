import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { CreatePetsRequestConfig, CreatePetsResponses } from '../../../models/ts/pets/CreatePets.ts'
import { client } from '../../../.kubb/client.ts'
import { createPetsResponseSchema, createPetsErrorSchema } from '../../../zod/pets/createPetsSchema.ts'

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export function createPets<ThrowOnError extends boolean = true>(
  options: Options<CreatePetsRequestConfig, ThrowOnError>,
): Promise<RequestResult<CreatePetsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'POST',
    url: '/pets/{uuid}',
    validator: { response: createPetsResponseSchema, error: createPetsErrorSchema },
    ...config,
    query: config.query ? { bool_param: config.query.boolParam, offset: config.query.offset } : config.query,
    headers: config.headers ? { 'X-EXAMPLE': config.headers.xEXAMPLE } : config.headers,
  }) as Promise<RequestResult<CreatePetsResponses, ThrowOnError>>
}
