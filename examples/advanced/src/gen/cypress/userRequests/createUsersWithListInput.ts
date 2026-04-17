import type { CreateUsersWithListInputData, CreateUsersWithListInputResponse } from '../../models/ts/userController/CreateUsersWithListInput.ts'

export function createUsersWithListInput(
  data?: CreateUsersWithListInputData,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<CreateUsersWithListInputResponse> {
  return cy
    .request<CreateUsersWithListInputResponse>({
      method: 'POST',
      url: '/user/createWithList',
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
