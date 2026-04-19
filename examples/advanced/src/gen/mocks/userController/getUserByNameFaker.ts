import type { GetUserByNameResponse, GetUserByNameStatus200 } from '../../models/ts/userController/GetUserByName.ts'
import { userFaker } from '../userFaker.ts'
import { faker } from '@faker-js/faker'

export function getUserByNamePathUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function getUserByNameStatus200Faker(data?: Partial<GetUserByNameStatus200>): GetUserByNameStatus200 {
  return userFaker(data)
}

/**
 * @description Invalid username supplied
 */
export function getUserByNameStatus400Faker() {
  return undefined
}

/**
 * @description User not found
 */
export function getUserByNameStatus404Faker() {
  return undefined
}

export function getUserByNameResponseFaker(_data?: GetUserByNameResponse): GetUserByNameResponse {
  return faker.helpers.arrayElement<any>([getUserByNameStatus200Faker(), getUserByNameStatus400Faker(), getUserByNameStatus404Faker()])
}
