import type { FindPetsByStatusResponse, FindPetsByStatusStatus200, FindPetsByStatusStatus400 } from '../../models/ts/petController/FindPetsByStatus.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

export function createFindPetsByStatusPathStepIdFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200Faker(data?: FindPetsByStatusStatus200): FindPetsByStatusStatus200 {
  return [...faker.helpers.multiple(() => createPetFaker(), { count: { min: 1, max: 3 } }), ...(data || [])]
}

/**
 * @description Invalid status value
 */
export function createFindPetsByStatusStatus400Faker() {
  return undefined
}

export function createFindPetsByStatusResponseFaker(_data?: FindPetsByStatusResponse): FindPetsByStatusResponse {
  return faker.helpers.arrayElement<any>([createFindPetsByStatusStatus200Faker(), createFindPetsByStatusStatus400Faker()])
}
