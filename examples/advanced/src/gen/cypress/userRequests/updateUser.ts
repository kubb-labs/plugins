import type { UpdateUserPathUsername, UpdateUserResponse } from '../../models/ts/userController/UpdateUser.ts'

export function updateUser(
  username: UpdateUserPathUsername,
  data?: UpdateUserData,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<UpdateUserResponse> {
  return cy
    .request<UpdateUserResponse>({
      method: 'PUT',
      url: `/user/${username}`,
      ...options,
    })
    .then((res) => res.body)
}
