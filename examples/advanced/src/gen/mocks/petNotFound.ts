import type { PetNotFound } from '../models/ts/PetNotFound.ts'
import { faker } from '@faker-js/faker'

export function petNotFoundFaker(data?: Partial<PetNotFound>): Required<PetNotFound> {
  return Object.assign({} as Required<PetNotFound>, { code: faker.number.int(), message: faker.string.alpha() }, data)
}
