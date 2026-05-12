import { faker } from '@faker-js/faker'

export function createUpdatePetWithFormPathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}

export function createUpdatePetWithFormQueryNameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createUpdatePetWithFormQueryStatusFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description Invalid input
 */
export function createUpdatePetWithFormStatus405Faker() {
  return undefined
}

export function createUpdatePetWithFormResponseFaker() {
  return undefined
}
