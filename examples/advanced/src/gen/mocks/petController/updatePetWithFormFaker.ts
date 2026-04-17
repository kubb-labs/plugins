import { faker } from '@faker-js/faker'

export function updatePetWithFormPathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}

export function updatePetWithFormQueryNameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function updatePetWithFormQueryStatusFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description Invalid input
 */
export function updatePetWithFormStatus405Faker() {
  return undefined
}

export function updatePetWithFormResponseFaker() {
  return undefined
}
