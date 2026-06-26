import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { GetPetByIdRequestConfig, GetPetByIdResponses } from '../../../models/ts/pet/GetPetById.ts'
import { client } from '../../../.kubb/client.ts'
import { getPetByIdResponseSchema, getPetByIdErrorSchema } from '../../../zod/pet/getPetByIdSchema.ts'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdRequestConfig, ThrowOnError>,
): Promise<RequestResult<GetPetByIdResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'GET',
    url: '/pet/{petId}:search',
    security: [{ type: 'apiKey', name: 'api_key', in: 'header' }, { type: 'oauth2' }],
    validator: { response: getPetByIdResponseSchema, error: getPetByIdErrorSchema },
    ...config,
  }) as Promise<RequestResult<GetPetByIdResponses, ThrowOnError>>
}
