import type { GetUserByNamePathUsername, GetUserByNameResponse } from '../../models/ts/userController/GetUserByName.ts'

export function getUserByName(username: GetUserByNamePathUsername, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<GetUserByNameResponse> {
  return cy
    .request<GetUserByNameResponse>({
      method: 'GET',
      url: `/user/${username}`,
      ...options,
    })
    .then((res) => res.body)
}
