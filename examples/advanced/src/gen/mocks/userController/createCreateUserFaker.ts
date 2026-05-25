import type { CreateUserData, CreateUserResponse, CreateUserStatusDefault } from '../../models/ts/userController/CreateUser.ts'
import { createUserFaker } from '../createUserFaker.ts'

/**
 * @description successful operation
 */
export function createCreateUserStatusDefaultFaker(data?: Partial<CreateUserStatusDefault>): CreateUserStatusDefault {
  return createUserFaker(data)
}

/**
 * @description Created user object
 */
export function createCreateUserDataFaker(data?: Partial<CreateUserData>): CreateUserData {
  return createUserFaker(data)
}

export function createCreateUserResponseFaker(data?: Partial<CreateUserResponse>): CreateUserResponse {
  return createCreateUserStatusDefaultFaker(data)
}
