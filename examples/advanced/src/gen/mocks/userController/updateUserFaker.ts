import type { UpdateUserData } from '../../models/ts/userController/UpdateUser.ts'
import { userFaker } from '../userFaker.ts'
import { faker } from '@faker-js/faker'

export function updateUserPathUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function updateUserStatusDefaultFaker() {
  return undefined
}

/**
 * @description Update an existent user in the store
 */
export function updateUserDataFaker(data?: Partial<UpdateUserData>): UpdateUserData {
  return userFaker(data)
}

export function updateUserResponseFaker() {
  return undefined
}
