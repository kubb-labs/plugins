import type {
  UpdatePetWithFormPathPetId,
  UpdatePetWithFormQueryName,
  UpdatePetWithFormQueryStatus,
  UpdatePetWithFormResponse,
} from '../../models/ts/petController/UpdatePetWithForm.ts'

export function updatePetWithForm(
  petId: UpdatePetWithFormPathPetId,
  params?: { name?: UpdatePetWithFormQueryName; status?: UpdatePetWithFormQueryStatus },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<UpdatePetWithFormResponse> {
  return cy
    .request<UpdatePetWithFormResponse>({
      method: 'POST',
      url: `/pet/${petId}:search`,
      qs: params,
      ...options,
    })
    .then((res) => res.body)
}
