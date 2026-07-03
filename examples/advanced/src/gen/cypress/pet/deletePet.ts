import type { DeletePetRequestConfig, DeletePetResponse } from '../../models/ts/pet/DeletePet.ts'

export function deletePet({ path, headers }: DeletePetRequestConfig, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<DeletePetResponse> {
  return cy
    .request<DeletePetResponse>({
      method: 'DELETE',
      url: `/pet/${path.petId}:search`,
      headers: headers ? { api_key: headers.apiKey } : headers,
      ...options,
    })
    .then((res) => res.body)
}
