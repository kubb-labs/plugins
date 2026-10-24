import type { AddPetRequest } from '../../models/ts/AddPetRequest'
import type { Pet } from '../../models/ts/Pet'

export function addPet(
  {
    body,
  }: {
    body: AddPetRequest | Omit<NonNullable<Pet>, 'id'>
    path?: never
    query?: never
    headers?: never
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<
  | {
      code?: number
      message?: string
    }
  | Omit<NonNullable<Pet>, 'name'>
> {
  return cy
    .request<
      | {
          code?: number
          message?: string
        }
      | Omit<NonNullable<Pet>, 'name'>
    >({
      method: 'POST',
      url: `/pet`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
