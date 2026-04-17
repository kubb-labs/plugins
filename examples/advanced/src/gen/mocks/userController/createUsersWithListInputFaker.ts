import { faker } from '@faker-js/faker'
import type {
  CreateUsersWithListInputData,
  CreateUsersWithListInputResponse,
  CreateUsersWithListInputStatus200,
} from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { userFaker } from '../userFaker.ts'

/**
 * @description Successful operation
 */
export function createUsersWithListInputStatus200Faker(data?: Partial<CreateUsersWithListInputStatus200>): CreateUsersWithListInputStatus200 {
  return userFaker(data)
}

/**
 * @description successful operation
 */
export function createUsersWithListInputStatusDefaultFaker() {
  return undefined
}

export function createUsersWithListInputDataFaker(data?: CreateUsersWithListInputData): CreateUsersWithListInputData {
  return [...faker.helpers.multiple(() => userFaker()), ...(data || [])]
}

export function createUsersWithListInputResponseFaker(_data?: CreateUsersWithListInputResponse): CreateUsersWithListInputResponse {
  return faker.helpers.arrayElement<any>([createUsersWithListInputStatus200Faker(), createUsersWithListInputStatusDefaultFaker()])
}
