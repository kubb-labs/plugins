import type { AddPetRequestConfig, AddPetResponse } from '../../models/ts/pet/AddPet.ts'

export function addPet({ body }: AddPetRequestConfig, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<AddPetResponse> {
  return cy
    .request<AddPetResponse>({
      method: 'POST',
      url: `/pet`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
