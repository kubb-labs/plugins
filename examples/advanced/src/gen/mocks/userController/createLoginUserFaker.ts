import type { LoginUserResponse, LoginUserStatus400 } from '../../models/ts/userController/LoginUser.ts'
import { faker } from '@faker-js/faker'

export function createLoginUserQueryUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createLoginUserQueryPasswordFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createLoginUserStatus200Faker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description Invalid username/password supplied
 */
export function createLoginUserStatus400Faker() {
  return undefined
}

export function createLoginUserResponseFaker(_data?: LoginUserResponse): LoginUserResponse {
  return faker.helpers.arrayElement<any>([createLoginUserStatus200Faker(), createLoginUserStatus400Faker()])
}
