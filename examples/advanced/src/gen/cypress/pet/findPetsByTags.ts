import type { FindPetsByTagsRequestConfig, FindPetsByTagsResponse } from '../../models/ts/pet/FindPetsByTags.ts'

export function findPetsByTags(
  { query, headers }: Omit<FindPetsByTagsRequestConfig, 'url'>,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<FindPetsByTagsResponse> {
  return cy
    .request<FindPetsByTagsResponse>({
      method: 'GET',
      url: `/pet/findByTags`,
      qs: query,
      headers: headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined,
      ...options,
    })
    .then((res) => res.body)
}
