import type {
  FindPetsByTagsQueryTags,
  FindPetsByTagsQueryPage,
  FindPetsByTagsQueryPageSize,
  FindPetsByTagsHeaderXEXAMPLE,
  FindPetsByTagsResponse,
} from '../../models/ts/pet/FindPetsByTags.ts'

export function findPetsByTags(
  {
    headers,
    params,
  }: {
    headers: { xEXAMPLE: FindPetsByTagsHeaderXEXAMPLE }
    params?: { tags?: FindPetsByTagsQueryTags; page?: FindPetsByTagsQueryPage; pageSize?: FindPetsByTagsQueryPageSize }
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<FindPetsByTagsResponse> {
  return cy
    .request<FindPetsByTagsResponse>({
      method: 'GET',
      url: `/pet/findByTags`,
      qs: params,
      headers: headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined,
      ...options,
    })
    .then((res) => res.body)
}
