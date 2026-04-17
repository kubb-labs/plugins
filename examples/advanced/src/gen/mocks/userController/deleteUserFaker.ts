import { faker } from '@faker-js/faker'
import type { DeleteUserResponse } from '../../models/ts/userController/DeleteUser.ts'

export function deleteUserPathUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description Invalid username supplied
 */
export function deleteUserStatus400Faker() {
  return undefined
}

/**
 * @description User not found
 */
export function deleteUserStatus404Faker() {
  return undefined
}

export function deleteUserResponseFaker(_data?: DeleteUserResponse): DeleteUserResponse {
  return faker.helpers.arrayElement<any>([deleteUserStatus400Faker(), deleteUserStatus404Faker()])
}
