import type { GetPetByIdRequestConfig, GetPetByIdResponse } from '../../models/ts/pet/GetPetById.ts'

export function getPetById(
  { path }: Omit<GetPetByIdRequestConfig, 'url'>,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<GetPetByIdResponse> {
  return cy
    .request<GetPetByIdResponse>({
      method: 'GET',
      url: `/pet/${path.petId}:search`,
      ...options,
    })
    .then((res) => res.body)
}
