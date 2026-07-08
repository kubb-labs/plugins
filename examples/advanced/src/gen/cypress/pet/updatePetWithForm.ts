import type { UpdatePetWithFormOptions, UpdatePetWithFormResponse } from '../../models/ts/pet/UpdatePetWithForm.ts'

export function updatePetWithForm(
  { path, query }: UpdatePetWithFormOptions,
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
