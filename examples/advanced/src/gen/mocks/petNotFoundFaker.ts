import { faker } from '@faker-js/faker'
import type { PetNotFound } from '../models/ts/PetNotFound.ts'

export function petNotFoundFaker(data?: Partial<PetNotFound>): PetNotFound {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...(data || {}),
  }
}
