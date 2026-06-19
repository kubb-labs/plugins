import type { FindPetsByStatusPathStepId, FindPetsByStatusResponse } from '../../models/ts/pet/FindPetsByStatus.ts'

export function findPetsByStatus(
  { stepId }: { stepId: FindPetsByStatusPathStepId },
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
