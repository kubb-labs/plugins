import type { CreatePetsOptions, CreatePetsResponse } from '../../models/ts/pets/CreatePets'

export function createPets(
  { path, query, body, headers }: CreatePetsOptions,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<CreatePetsResponse> {
  return cy
    .request<CreatePetsResponse>({
      method: 'POST',
      url: `/pets/${path.uuid}`,
      qs: query,
      headers,
      body,
      ...options,
    })
    .then((res) => res.body)
}
