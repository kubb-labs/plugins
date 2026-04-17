import { faker } from '@faker-js/faker'

export function deletePetHeaderApiKeyFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function deletePetPathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}

/**
 * @description Invalid pet value
 */
export function deletePetStatus400Faker() {
  return undefined
}

export function deletePetResponseFaker() {
  return undefined
}
