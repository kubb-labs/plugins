import type { DeletePetRequestConfig, DeletePetResponse } from '../../models/ts/pet/DeletePet.ts'

export function deletePet(
  { path, headers }: Omit<DeletePetRequestConfig, 'url'>,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<DeletePetResponse> {
  const { petId } = path

  return cy
    .request<DeletePetResponse>({
      method: 'DELETE',
      url: `/pet/${petId}:search`,
      headers: headers ? { api_key: headers.apiKey } : undefined,
      ...options,
    })
    .then((res) => res.body)
}
