import type {
  CreateUsersWithListInputData,
  CreateUsersWithListInputResponse,
  CreateUsersWithListInputStatus200,
  CreateUsersWithListInputStatus200Json,
  CreateUsersWithListInputStatus200Xml,
  CreateUsersWithListInputStatusDefault,
} from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInputStatus200FakerJson(data?: Partial<CreateUsersWithListInputStatus200Json>): CreateUsersWithListInputStatus200Json {
  return createUserFaker(data)
}

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInputStatus200FakerXml(data?: Partial<CreateUsersWithListInputStatus200Xml>): CreateUsersWithListInputStatus200Xml {
  return createUserFaker(data)
}

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInputStatus200Faker(_data?: CreateUsersWithListInputStatus200): CreateUsersWithListInputStatus200 {
  return faker.helpers.arrayElement<any>([createCreateUsersWithListInputStatus200FakerJson(), createCreateUsersWithListInputStatus200FakerXml()])
}

/**
 * @description successful operation
 */
export function createCreateUsersWithListInputStatusDefaultFaker() {
  return undefined
}

export function createCreateUsersWithListInputDataFaker(data?: CreateUsersWithListInputData): CreateUsersWithListInputData {
  return [...faker.helpers.multiple(() => createUserFaker()), ...(data || [])]
}

export function createCreateUsersWithListInputResponseFaker(_data?: CreateUsersWithListInputResponse): CreateUsersWithListInputResponse {
  return faker.helpers.arrayElement<any>([createCreateUsersWithListInputStatus200Faker(), createCreateUsersWithListInputStatusDefaultFaker()])
}
