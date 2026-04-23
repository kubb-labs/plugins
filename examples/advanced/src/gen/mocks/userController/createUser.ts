import type { CreateUserResponse, CreateUserStatusDefault } from '../../models/ts/userController/CreateUser.ts'
import { userFaker } from '../user.ts'

/**
 * @description successful operation
 */
export function createUserStatusDefault(data?: Partial<CreateUserStatusDefault>): CreateUserStatusDefault {
  return userFaker(data)
}

export function createUserResponse(data?: Partial<CreateUserResponse>): CreateUserResponse {
  return createUserStatusDefault(data)
}
