import type { User } from '../models/ts/User.ts'
import { tagTagFaker } from './tag/tag.ts'
import { faker } from '@faker-js/faker'

export function userFaker(data?: Partial<User>): Required<User> {
  const defaultFakeData = {
    id: faker.number.bigInt(),
    username: faker.string.alpha(),
    uuid: faker.string.uuid(),
    tag: tagTagFaker(),
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
  } as Required<User>
}
