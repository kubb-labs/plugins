import type { Pet } from '../../models/ts/Pet'

export function updatePet(
  {
    body,
  }: Pick<
    | {
        body: Omit<NonNullable<Pet>, 'id'>
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
  | Omit<NonNullable<Pet>, 'name'>
  | {
      id?: number
    }
> {
  return cy
    .request<
      | Omit<NonNullable<Pet>, 'name'>
      | {
          id?: number
        }
    >({
      method: 'PUT',
      url: `/pet`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
