import type { UpdateUserPathUsername, UpdateUserData, UpdateUserResponse } from '../../models/ts/userController/UpdateUser.ts'

export function updateUser(
  username: UpdateUserPathUsername,
  data?: UpdateUserData,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<UpdateUserResponse> {
  return cy
    .request<UpdateUserResponse>({
      method: 'PUT',
      url: `/user/${username}`,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
