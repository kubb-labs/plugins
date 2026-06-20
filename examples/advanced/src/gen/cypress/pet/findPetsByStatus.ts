import type { FindPetsByStatusRequestConfig, FindPetsByStatusResponse } from '../../models/ts/pet/FindPetsByStatus.ts'

export function findPetsByStatus(
  { path }: FindPetsByStatusRequestConfig,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<FindPetsByStatusResponse> {
  return cy
    .request<FindPetsByStatusResponse>({
      method: 'GET',
      url: `/pet/findByStatus/${path.stepId}`,
      ...options,
    })
    .then((res) => res.body)
}
