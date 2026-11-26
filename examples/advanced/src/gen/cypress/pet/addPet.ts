import type { AddPetRequest } from '../../models/ts/AddPetRequest'
import type { Pet } from '../../models/ts/Pet'

type AddPetResponse =
  | {
      code?: number
      message?: string
    }
  | (Omit<NonNullable<Pet>, 'name'> | string)

export function addPet(
  {
    body,
  }: Pick<
    | {
        body: AddPetRequest
        path?: never
        query?: never
        headers?: never
        contentType?:
          | 'application/json'
          | {
              request: 'application/json'
            }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType:
          | 'application/xml'
          | {
              request: 'application/xml'
            }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType:
          | 'application/x-www-form-urlencoded'
          | {
              request: 'application/x-www-form-urlencoded'
            }
      },
    'body'
  >,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<AddPetResponse> {
  return cy
    .request<AddPetResponse>({
      method: 'POST',
      url: `/pet`,
      body,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<AddPetResponse>
}
