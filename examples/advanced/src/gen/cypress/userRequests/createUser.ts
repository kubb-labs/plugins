import type { CreateUserData, CreateUserResponse } from '../../models/ts/userController/CreateUser.ts'

export function createUser(data?: CreateUserData, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<CreateUserResponse> {
  return cy
    .request<CreateUserResponse>({
      method: 'POST',
      url: '/user',
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
