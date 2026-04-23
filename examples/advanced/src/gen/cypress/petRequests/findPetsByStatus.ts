import type { FindPetsByStatusPathStepId, FindPetsByStatusResponse } from '../../models/ts/petController/FindPetsByStatus.ts'

export function findPetsByStatus(
  stepId: FindPetsByStatusPathStepId,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<FindPetsByStatusResponse> {
  return cy
    .request<FindPetsByStatusResponse>({
      method: 'GET',
      url: `/pet/findByStatus/${stepId}`,
      ...options,
    })
    .then((res) => res.body)
}
