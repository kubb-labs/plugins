import type { Pet } from '../../models/ts/Pet'

type GetPetByIdStatus200 = Omit<NonNullable<Pet>, 'name'> | string

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
): Cypress.Chainable<GetPetByIdStatus200> {
  return cy
    .request<GetPetByIdStatus200>({
      method: 'GET',
      url: `/pet/${path.petId}:search`,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<GetPetByIdStatus200>
}
