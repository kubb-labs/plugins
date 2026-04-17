import type { DeleteUserPathUsername, DeleteUserResponse } from '../../models/ts/userController/DeleteUser.ts'

export function deleteUser(username: DeleteUserPathUsername, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<DeleteUserResponse> {
  return cy
    .request<DeleteUserResponse>({
      method: 'DELETE',
      url: `/user/${username}`,
      ...options,
    })
    .then((res) => res.body)
}
