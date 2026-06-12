import type { User } from '../models/ts/User.ts'
import { createCategoryFaker } from './createCategoryFaker.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createUserFaker<TData extends Partial<User> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int(),
    username: faker.string.alpha(),
    uuid: faker.string.uuid(),
    tag: createCategoryFaker(),
    firstName: faker.string.alpha(),
    lastName: faker.string.alpha(),
    email: faker.internet.email(),
    password: faker.string.alpha(),
    phone: faker.string.alpha(),
    userStatus: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
