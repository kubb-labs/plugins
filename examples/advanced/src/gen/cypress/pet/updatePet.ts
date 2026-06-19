import type { UpdatePetData, UpdatePetResponse } from '../../models/ts/pet/UpdatePet.ts'

export function updatePet({ data }: { data: UpdatePetData }, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<UpdatePetResponse> {
  return cy
    .request<UpdatePetResponse>({
      method: 'PUT',
      url: `/pet`,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
