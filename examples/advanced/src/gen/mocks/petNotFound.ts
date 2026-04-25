import type { PetNotFound } from '../models/ts/PetNotFound.ts'
import { faker } from '@faker-js/faker'

export function petNotFoundFaker(data?: Partial<PetNotFound>): Required<PetNotFound> {
  const defaultFakeData = { code: faker.number.int(), message: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<PetNotFound>
}
