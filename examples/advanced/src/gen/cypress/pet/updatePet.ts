import type { UpdatePetRequestConfig, UpdatePetResponse } from '../../models/ts/pet/UpdatePet.ts'

export function updatePet({ body }: UpdatePetRequestConfig, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<UpdatePetResponse> {
  return cy
    .request<UpdatePetResponse>({
      method: 'PUT',
      url: `/pet`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
