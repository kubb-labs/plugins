import type { UpdatePetWithFormRequestConfig, UpdatePetWithFormResponse } from '../../models/ts/pet/UpdatePetWithForm.ts'

export function updatePetWithForm(
  { path, query }: Omit<UpdatePetWithFormRequestConfig, 'url'>,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<UpdatePetWithFormResponse> {
  return cy
    .request<UpdatePetWithFormResponse>({
      method: 'POST',
      url: `/pet/${path.petId}:search`,
      qs: query,
      ...options,
    })
    .then((res) => res.body)
}
