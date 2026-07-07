import { fakerEN as faker } from '@faker-js/faker'

export function createDeletePetHeaderApiKey(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createDeletePetPathPetId(data?: number): number {
  return data ?? faker.number.int()
}

/**
 * @description Invalid pet value
 */
export function createDeletePetStatus400() {
  return undefined
}

export function createDeletePetResponse() {
  return undefined
}
