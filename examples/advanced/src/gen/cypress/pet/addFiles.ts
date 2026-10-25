import type { Pet } from '../../models/ts/Pet'

export function addFiles(
  {
    body,
  }: {
    body:
      | {
          url: string
        }
      | Omit<NonNullable<Pet>, 'id'>
    path?: never
    query?: never
    headers?: never
  },
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
