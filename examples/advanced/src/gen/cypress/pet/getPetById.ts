import type { GetPetByIdRequestConfig, GetPetByIdResponse } from '../../models/ts/pet/GetPetById.ts'

export function getPetById(
  { path }: Omit<GetPetByIdRequestConfig, 'url'>,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<GetPetByIdResponse> {
  const { petId } = path

  return cy
    .request<GetPetByIdResponse>({
      method: 'GET',
      url: `/pet/${petId}:search`,
      ...options,
    })
    .then((res) => res.body)
}
