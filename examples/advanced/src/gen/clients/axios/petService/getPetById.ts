import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { GetPetByIdRequestConfig, GetPetByIdResponses } from '../../../models/ts/pet/GetPetById.ts'
import { client } from '../../../.kubb/client.ts'
import { getPetByIdResponseSchema } from '../../../zod/pet/getPetByIdSchema.ts'

export function getGetPetByIdUrl(path: GetPetByIdRequestConfig['path']) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/pet/${path.petId}:search` as const }

  return res
}

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
    parser: { response: (data: unknown) => getPetByIdResponseSchema.parse(data) },
    ...config,
  }) as Promise<RequestResult<GetPetByIdResponses, ThrowOnError>>
}
