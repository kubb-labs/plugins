import type {
  GetUserByNameResponse,
  GetUserByNameStatus200,
  GetUserByNameStatus200Json,
  GetUserByNameStatus200Xml,
  GetUserByNameStatus400,
  GetUserByNameStatus404,
} from '../../models/ts/user/GetUserByName.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createGetUserByNamePathUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createGetUserByNameStatus200FakerJson(data?: Partial<GetUserByNameStatus200Json>): GetUserByNameStatus200Json {
  return createUserFaker(data) as GetUserByNameStatus200Json
}

/**
 * @description successful operation
 */
export function createGetUserByNameStatus200FakerXml(data?: Partial<GetUserByNameStatus200Xml>): GetUserByNameStatus200Xml {
  return createUserFaker(data) as GetUserByNameStatus200Xml
}

/**
 * @description successful operation
 */
export function createGetUserByNameStatus200Faker(_data?: GetUserByNameStatus200): GetUserByNameStatus200 {
  return faker.helpers.arrayElement<any>([createGetUserByNameStatus200FakerJson(), createGetUserByNameStatus200FakerXml()])
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
