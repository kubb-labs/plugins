import type { Pet } from '../../models/ts/Pet'

export function addFiles(
  {
    body,
  }: Pick<
    | {
        body: {
          url: string
        }
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
          request: 'multipart/form-data'
        }
      },
    'body'
  >,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<Omit<NonNullable<Pet>, 'name'>> {
  return cy
    .request<Omit<NonNullable<Pet>, 'name'>>({
      method: 'POST',
      url: `/pet/files`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
