import type { LogoutUserResponse } from '../../models/ts/userController/LogoutUser.ts'

export function logoutUser(options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<LogoutUserResponse> {
  return cy
    .request<LogoutUserResponse>({
      method: 'GET',
      url: `/user/logout`,
      ...options,
    })
    .then((res) => res.body)
}
