import type { Pet } from '../../models/ts/Pet'

export function findPetsByStatus(
  {
    path,
  }: {
    body?: never
    path: {
      step_id: string
    }
    query?: never
    headers?: never
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<Array<Pet>> {
  return cy
    .request<Array<Pet>>({
      method: 'GET',
      url: `/pet/findByStatus/${path.step_id}`,
      ...options,
    })
    .then((res) => res.body)
}
