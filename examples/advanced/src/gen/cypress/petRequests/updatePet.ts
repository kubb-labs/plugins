import type { UpdatePetResponse } from '../../models/ts/petController/UpdatePet.ts'

export function updatePet(data: UpdatePetData, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<UpdatePetResponse> {
  return cy
    .request<UpdatePetResponse>({
      method: 'PUT',
      url: `/pet`,
      ...options,
    })
    .then((res) => res.body)
}
