import type { CreateUserData, CreateUserResponse, CreateUserStatusDefault } from '../../models/ts/userController/CreateUser.ts'
import { userFaker } from '../userFaker.ts'

/**
 * @description successful operation
 */
export function createUserStatusDefaultFaker(data?: Partial<CreateUserStatusDefault>): CreateUserStatusDefault {
  return userFaker(data)
}

/**
 * @description Created user object
 */
export function createUserDataFaker(data?: Partial<CreateUserData>): CreateUserData {
  return userFaker(data)
}

export function createUserResponseFaker(data?: Partial<CreateUserResponse>): CreateUserResponse {
  return createUserStatusDefaultFaker(data)
}
