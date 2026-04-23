import type {
  CreateUsersWithListInputData,
  CreateUsersWithListInputResponse,
  CreateUsersWithListInputStatus200,
} from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { userFaker } from '../user.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createUsersWithListInputStatus200(data?: Partial<CreateUsersWithListInputStatus200>): CreateUsersWithListInputStatus200 {
  return userFaker(data)
}

/**
 * @description successful operation
 */
export function createUsersWithListInputStatusDefault() {
  return undefined
}

export function createUsersWithListInputData(data?: CreateUsersWithListInputData): CreateUsersWithListInputData {
  return [...faker.helpers.multiple(() => userFaker()), ...(data || [])]
}

export function createUsersWithListInputResponse(_data?: CreateUsersWithListInputResponse): CreateUsersWithListInputResponse {
  return faker.helpers.arrayElement<any>([createUsersWithListInputStatus200(), createUsersWithListInputStatusDefault()])
}
