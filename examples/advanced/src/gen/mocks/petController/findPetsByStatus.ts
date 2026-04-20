import type { FindPetsByStatusResponse, FindPetsByStatusStatus200 } from '../../models/ts/petController/FindPetsByStatus.ts'
import { petFaker } from '../pet.ts'
import { faker } from '@faker-js/faker'

export function findPetsByStatusPathStepId(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function findPetsByStatusStatus200(data?: FindPetsByStatusStatus200): FindPetsByStatusStatus200 {
  return [...faker.helpers.multiple(() => petFaker(), { count: { min: 1, max: 3 } }), ...(data || [])]
}

/**
 * @description Invalid status value
 */
export function findPetsByStatusStatus400() {
  return undefined
}

export function findPetsByStatusResponse(_data?: FindPetsByStatusResponse): FindPetsByStatusResponse {
  return faker.helpers.arrayElement<any>([findPetsByStatusStatus200(), findPetsByStatusStatus400()])
}
