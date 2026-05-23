import { faker } from '@faker-js/faker'

export function createFindPetsByStatusPathStepIdFaker(data?: string): string {
  return data ?? faker.string.alpha()
}
