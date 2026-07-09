import type { DeletePetOptions, DeletePetResponse } from '../../models/ts/pet/DeletePet'

export function deletePet({ path, headers }: DeletePetOptions, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<DeletePetResponse> {
  return cy
    .request<DeletePetResponse>({
      method: 'DELETE',
      url: `/pet/${path.petId}:search`,
      headers: headers ? { api_key: headers.apiKey } : headers,
      ...options,
    })
    .then((res) => res.body)
}
