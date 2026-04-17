import { faker } from '@faker-js/faker'
import type { UserArray } from '../models/ts/UserArray.ts'
import { userFaker } from './userFaker.ts'

export function userArrayFaker(data?: UserArray): UserArray {
  return [...faker.helpers.multiple(() => userFaker()), ...(data || [])]
}
