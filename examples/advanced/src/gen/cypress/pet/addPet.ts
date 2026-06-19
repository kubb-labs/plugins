import type { AddPetData, AddPetResponse } from '../../models/ts/pet/AddPet.ts'

export function addPet({ data }: { data: AddPetData }, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<AddPetResponse> {
  return cy
    .request<AddPetResponse>({
      method: 'POST',
      url: `/pet`,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
