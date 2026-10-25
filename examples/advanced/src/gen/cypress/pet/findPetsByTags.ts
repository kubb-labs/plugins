import type { FindPetsByTagsXEXAMPLEKey } from '../../models/ts/FindPetsByTagsXEXAMPLE'
import type { Pet } from '../../models/ts/Pet'

export function findPetsByTags(
  {
    query,
    headers,
  }: {
    body?: never
    path?: never
    query?: {
      tags?: Array<string>
      page?: string
      pageSize?: number
    }
    headers: {
      'X-EXAMPLE': FindPetsByTagsXEXAMPLEKey
    }
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<Array<Pet>> {
  return cy
    .request<Array<Pet>>({
      method: 'GET',
      url: `/pet/findByTags`,
      qs: query,
      headers,
      ...options,
    })
    .then((res) => res.body)
}
