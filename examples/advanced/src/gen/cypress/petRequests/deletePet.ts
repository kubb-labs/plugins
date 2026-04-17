import type { DeletePetHeaderApiKey, DeletePetPathPetId, DeletePetResponse } from '../../models/ts/petController/DeletePet.ts'

export function deletePet(
  petId: DeletePetPathPetId,
  headers?: { apiKey?: DeletePetHeaderApiKey },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<DeletePetResponse> {
  return cy
    .request<DeletePetResponse>({
      method: 'DELETE',
      url: `/pet/${petId}:search`,
      headers: headers ? { api_key: headers.apiKey } : undefined,
      ...options,
    })
    .then((res) => res.body)
}
