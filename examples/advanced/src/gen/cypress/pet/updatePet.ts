import type { UpdatePetOptions, UpdatePetResponse } from '../../models/ts/pet/UpdatePet'

export function updatePet({ body }: UpdatePetOptions, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<UpdatePetResponse> {
  return cy
    .request<UpdatePetResponse>({
      method: 'PUT',
      url: `/pet`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
