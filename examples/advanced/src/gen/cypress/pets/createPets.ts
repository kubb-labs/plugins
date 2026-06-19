import type { CreatePetsRequestConfig, CreatePetsResponse } from '../../models/ts/pets/CreatePets.ts'

export function createPets(
  { path, query, body, headers }: Omit<CreatePetsRequestConfig, 'url'>,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<CreatePetsResponse> {
  const { uuid } = path

  return cy
    .request<CreatePetsResponse>({
      method: 'POST',
      url: `/pets/${uuid}`,
      qs: query ? { bool_param: query.boolParam, offset: query.offset } : undefined,
      headers: headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined,
      body,
      ...options,
    })
    .then((res) => res.body)
}
