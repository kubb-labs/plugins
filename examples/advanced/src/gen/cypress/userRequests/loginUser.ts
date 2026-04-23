import type { LoginUserQueryUsername, LoginUserQueryPassword, LoginUserResponse } from '../../models/ts/userController/LoginUser.ts'

export function loginUser(
  params?: { username?: LoginUserQueryUsername; password?: LoginUserQueryPassword },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<LoginUserResponse> {
  return cy
    .request<LoginUserResponse>({
      method: 'GET',
      url: `/user/login`,
      qs: params,
      ...options,
    })
    .then((res) => res.body)
}
