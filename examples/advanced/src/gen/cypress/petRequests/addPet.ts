import type { AddPetData, AddPetResponse } from '../../models/ts/petController/AddPet.ts'

export function addPet(data: AddPetData, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<AddPetResponse> {
  return cy
    .request<AddPetResponse>({
      method: 'POST',
      url: `/pet`,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
