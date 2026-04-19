import type { LoginUserResponse } from '../../models/ts/userController/LoginUser.ts'
import { faker } from '@faker-js/faker'

export function loginUserQueryUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function loginUserQueryPasswordFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function loginUserStatus200Faker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description Invalid username/password supplied
 */
export function loginUserStatus400Faker() {
  return undefined
}

export function loginUserResponseFaker(_data?: LoginUserResponse): LoginUserResponse {
  return faker.helpers.arrayElement<any>([loginUserStatus200Faker(), loginUserStatus400Faker()])
}
