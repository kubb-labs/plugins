import type { FindPetsByStatusResponse, FindPetsByStatusStatus200 } from '../../models/ts/petController/FindPetsByStatus.ts'
import { petFaker } from '../petFaker.ts'
import { faker } from '@faker-js/faker'

export function findPetsByStatusPathStepIdFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function findPetsByStatusStatus200Faker(data?: FindPetsByStatusStatus200): FindPetsByStatusStatus200 {
  return [...faker.helpers.multiple(() => petFaker(), { count: { min: 1, max: 3 } }), ...(data || [])]
}

/**
 * @description Invalid status value
 */
export function findPetsByStatusStatus400Faker() {
  return undefined
}

export function findPetsByStatusResponseFaker(_data?: FindPetsByStatusResponse): FindPetsByStatusResponse {
  return faker.helpers.arrayElement<any>([findPetsByStatusStatus200Faker(), findPetsByStatusStatus400Faker()])
}
