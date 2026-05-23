import { faker } from '@faker-js/faker'

export function createDeletePetHeaderApiKeyFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createDeletePetPathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}
