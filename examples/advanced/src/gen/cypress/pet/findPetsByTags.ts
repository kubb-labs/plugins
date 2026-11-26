import type { FindPetsByTagsXEXAMPLEEnumKey } from '../../models/ts/FindPetsByTagsXEXAMPLEEnum'
import type { Pet } from '../../models/ts/Pet'

type FindPetsByTagsStatus200 = Array<Pet> | string

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
      'X-EXAMPLE': FindPetsByTagsXEXAMPLEEnumKey
    }
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<FindPetsByTagsStatus200> {
  return cy
    .request<FindPetsByTagsStatus200>({
      method: 'GET',
      url: `/pet/findByTags`,
      qs: query,
      headers,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<FindPetsByTagsStatus200>
}
