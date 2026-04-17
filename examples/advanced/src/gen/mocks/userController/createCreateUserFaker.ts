import type { CreateUserError, CreateUserMutationRequest } from '../../models/ts/userController/CreateUser.ts'
import { createUserFaker } from '../createUserFaker.ts'

/**
 * @description successful operation
 */
export function createCreateUserErrorFaker(data?: Partial<CreateUserError>): CreateUserError {
  return createUserFaker(data)
}

/**
 * @description Created user object
 */
export function createCreateUserMutationRequestFaker(data?: Partial<CreateUserMutationRequest>): CreateUserMutationRequest {
  return createUserFaker(data)
}
