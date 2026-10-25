import type { AddPetRequest } from '../../models/ts/AddPetRequest'
import type { Pet } from '../../models/ts/Pet'

export function addPet(
  {
    body,
  }: Pick<
    | {
        body: AddPetRequest
        path?: never
        query?: never
        headers?: never
        contentType?: {
          request: 'application/json'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/xml'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/x-www-form-urlencoded'
        }
      },
    'body'
  >,
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
