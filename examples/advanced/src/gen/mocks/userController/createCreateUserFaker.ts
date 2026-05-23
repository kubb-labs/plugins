import type { CreateUserData } from '../../models/ts/userController/CreateUser.ts'
import { createUserFaker } from '../createUserFaker.ts'

/**
 * @description Created user object
 */
export function createCreateUserDataFaker(data?: Partial<CreateUserData>): CreateUserData {
  return createUserFaker(data)
}
