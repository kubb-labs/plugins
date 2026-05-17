import type { DeleteUserResponse, DeleteUserStatus400, DeleteUserStatus404 } from '../../models/ts/userController/DeleteUser.ts'
import { faker } from '@faker-js/faker'

export function createDeleteUserPathUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description Invalid username supplied
 */
export function createDeleteUserStatus400Faker() {
  return undefined
}

/**
 * @description User not found
 */
export function createDeleteUserStatus404Faker() {
  return undefined
}

export function createDeleteUserResponseFaker(_data?: DeleteUserResponse): DeleteUserResponse {
  return faker.helpers.arrayElement<any>([createDeleteUserStatus400Faker(), createDeleteUserStatus404Faker()])
}
