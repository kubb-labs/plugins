import type { Pet } from '../../models/ts/Pet'

export function getPetById(
  {
    path,
  }: {
    body?: never
    path: {
      petId: number
    }
    query?: never
    headers?: never
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<Omit<NonNullable<Pet>, 'name'> | string> {
  return cy
    .request<Omit<NonNullable<Pet>, 'name'> | string>({
      method: 'GET',
      url: `/pet/${path.petId}:search`,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<Omit<NonNullable<Pet>, 'name'> | string>
}
