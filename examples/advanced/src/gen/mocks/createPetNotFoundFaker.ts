import type { PetNotFound } from '../models/ts/PetNotFound.ts'
import { faker } from '@faker-js/faker'

export function createPetNotFoundFaker<TData extends Partial<PetNotFound> = object>(data?: TData) {
  const defaultFakeData = { code: faker.number.int(), message: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
