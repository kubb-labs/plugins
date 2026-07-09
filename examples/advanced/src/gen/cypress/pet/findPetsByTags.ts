import type { FindPetsByTagsOptions, FindPetsByTagsResponse } from '../../models/ts/pet/FindPetsByTags'

export function findPetsByTags(
  { query, headers }: FindPetsByTagsOptions,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<FindPetsByTagsResponse> {
  return cy
    .request<FindPetsByTagsResponse>({
      method: 'GET',
      url: `/pet/findByTags`,
      qs: query,
      headers: headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : headers,
      ...options,
    })
    .then((res) => res.body)
}
