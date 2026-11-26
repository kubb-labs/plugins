import type { Pet } from '../../models/ts/Pet'

type FindPetsByStatusStatus200 = Array<Pet> | string

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
): Cypress.Chainable<FindPetsByStatusStatus200> {
  return cy
    .request<FindPetsByStatusStatus200>({
      method: 'GET',
      url: `/pet/findByStatus/${path.step_id}`,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<FindPetsByStatusStatus200>
}
