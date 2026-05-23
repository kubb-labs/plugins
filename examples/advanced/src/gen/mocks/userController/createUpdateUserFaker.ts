import type { UpdateUserData } from '../../models/ts/userController/UpdateUser.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { faker } from '@faker-js/faker'

export function createUpdateUserPathUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description Update an existent user in the store
 */
export function createUpdateUserDataFaker(data?: Partial<UpdateUserData>): UpdateUserData {
  return createUserFaker(data)
}
