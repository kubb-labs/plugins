import { faker } from '@faker-js/faker'

export function createGetPetByIdPathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}
