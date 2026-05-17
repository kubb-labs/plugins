import type {
  GetUserByNameResponse,
  GetUserByNameStatus200,
  GetUserByNameStatus400,
  GetUserByNameStatus404,
} from '../../models/ts/userController/GetUserByName.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { faker } from '@faker-js/faker'

export function createGetUserByNamePathUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createGetUserByNameStatus200Faker(data?: Partial<GetUserByNameStatus200>): GetUserByNameStatus200 {
  return createUserFaker(data)
}

/**
 * @description Invalid username supplied
 */
export function createGetUserByNameStatus400Faker() {
  return undefined
}

/**
 * @description User not found
 */
export function createGetUserByNameStatus404Faker() {
  return undefined
}

export function createGetUserByNameResponseFaker(_data?: GetUserByNameResponse): GetUserByNameResponse {
  return faker.helpers.arrayElement<any>([createGetUserByNameStatus200Faker(), createGetUserByNameStatus400Faker(), createGetUserByNameStatus404Faker()])
}
