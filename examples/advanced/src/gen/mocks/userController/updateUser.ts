import type { UpdateUserData } from '../../models/ts/userController/UpdateUser.ts'
import { userFaker } from '../user.ts'
import { faker } from '@faker-js/faker'

export function updateUserPathUsername(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function updateUserStatusDefault() {
  return undefined
}

/**
 * @description Update an existent user in the store
 */
export function updateUserData(data?: Partial<UpdateUserData>): UpdateUserData {
  return userFaker(data)
}

export function updateUserResponse() {
  return undefined
}
