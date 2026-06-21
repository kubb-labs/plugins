import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { CreatePetsRequestConfig, CreatePetsResponses } from '../../../models/ts/pets/CreatePets.ts'
import { client } from '../../../.kubb/client.ts'
import { createPetsResponseSchema } from '../../../zod/pets/createPetsSchema.ts'

export function getCreatePetsUrl(path: CreatePetsRequestConfig['path']) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pets/${path.uuid}` as const }

  return res
}

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export function createPets<ThrowOnError extends boolean = true>(
  options: Options<CreatePetsRequestConfig, ThrowOnError>,
): Promise<RequestResult<CreatePetsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'POST', url: '/pets/{uuid}', parser: { response: (data: unknown) => createPetsResponseSchema.parse(data) }, ...config }) as Promise<
    RequestResult<CreatePetsResponses, ThrowOnError>
  >
}
