import type { FindPetsByStatusRequestConfig, FindPetsByStatusResponse } from '../../models/ts/pet/FindPetsByStatus.ts'

export function findPetsByStatus(
  { path }: Omit<FindPetsByStatusRequestConfig, 'url'>,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<FindPetsByStatusResponse> {
  const { stepId } = path

  return cy
    .request<FindPetsByStatusResponse>({
      method: 'GET',
      url: `/pet/findByStatus/${stepId}`,
      ...options,
    })
    .then((res) => res.body)
}
