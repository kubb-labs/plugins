import type { User } from '../models/ts/User.ts'
import { tagTagFaker } from './tag/tag.ts'
import { faker } from '@faker-js/faker'

export function userFaker(data?: Partial<User>): Required<User> {
  return Object.assign(
    {} as Required<User>,
    {
      id: faker.number.int(),
      username: faker.string.alpha(),
      uuid: faker.string.uuid(),
      tag: tagTagFaker(),
      firstName: faker.string.alpha(),
      lastName: faker.string.alpha(),
      email: faker.internet.email(),
      password: faker.string.alpha(),
      phone: faker.string.alpha(),
      userStatus: faker.number.int(),
    },
    data,
  )
}
