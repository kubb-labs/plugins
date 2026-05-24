import type {
  CreateUsersWithListInputData,
  CreateUsersWithListInputResponse,
  CreateUsersWithListInputStatus200,
  CreateUsersWithListInputStatusDefault,
} from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInputStatus200Faker(data?: Partial<CreateUsersWithListInputStatus200>): CreateUsersWithListInputStatus200 {
  return createUserFaker(data)
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
