import type { AddPetOptions, AddPetResponse } from '../../models/ts/pet/AddPet'

export function addPet({ body }: AddPetOptions, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<AddPetResponse> {
  return cy
    .request<AddPetResponse>({
      method: 'POST',
      url: `/pet`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
