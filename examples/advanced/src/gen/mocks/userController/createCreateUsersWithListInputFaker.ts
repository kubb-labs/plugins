import type { CreateUsersWithListInputData } from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { faker } from '@faker-js/faker'

export function createCreateUsersWithListInputDataFaker(data?: CreateUsersWithListInputData): CreateUsersWithListInputData {
  return [...faker.helpers.multiple(() => createUserFaker()), ...(data || [])]
}
