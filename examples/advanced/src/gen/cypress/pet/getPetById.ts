import type { GetPetByIdPathPetId, GetPetByIdResponse } from '../../models/ts/pet/GetPetById.ts'

export function getPetById(petId: GetPetByIdPathPetId, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<GetPetByIdResponse> {
  return cy
    .request<GetPetByIdResponse>({
      method: 'GET',
      url: `/pet/${petId}:search`,
      ...options,
    })
    .then((res) => res.body)
}
