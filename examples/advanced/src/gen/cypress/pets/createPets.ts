import type { CreatePetsRequestConfig, CreatePetsResponse } from '../../models/ts/pets/CreatePets.ts'

export function createPets(
  { path, query, body, headers }: CreatePetsRequestConfig,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<CreatePetsResponse> {
  return cy
    .request<CreatePetsResponse>({
      method: 'POST',
      url: `/pets/${path.uuid}`,
      qs: query ? { bool_param: query.boolParam, offset: query.offset } : query,
      headers: headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : headers,
      body,
      ...options,
    })
    .then((res) => res.body)
}
