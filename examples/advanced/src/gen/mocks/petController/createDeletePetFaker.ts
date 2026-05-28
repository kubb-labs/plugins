import { fakerEN as faker } from '@faker-js/faker'

export function createDeletePetHeaderApiKeyFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createDeletePetPathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}

/**
 * @description Invalid pet value
 */
export function createDeletePetStatus400Faker() {
  return undefined
}

export function createDeletePetResponseFaker() {
  return undefined
}
