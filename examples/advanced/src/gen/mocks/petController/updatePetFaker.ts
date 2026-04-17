import { faker } from '@faker-js/faker'
import type { UpdatePetData, UpdatePetResponse, UpdatePetStatus200, UpdatePetStatus202 } from '../../models/ts/petController/UpdatePet.ts'
import { petFaker } from '../petFaker.ts'

/**
 * @description Successful operation
 */
export function updatePetStatus200Faker(data?: Partial<UpdatePetStatus200>): UpdatePetStatus200 {
  return petFaker(data)
}

/**
 * @description accepted operation
 */
export function updatePetStatus202Faker(data?: Partial<UpdatePetStatus202>): UpdatePetStatus202 {
  return {
    ...{ id: faker.number.int() },
    ...(data || {}),
  }
}

/**
 * @description Invalid ID supplied
 */
export function updatePetStatus400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function updatePetStatus404Faker() {
  return undefined
}

/**
 * @description Validation exception
 */
export function updatePetStatus405Faker() {
  return undefined
}

/**
 * @description Update an existent pet in the store
 */
export function updatePetDataFaker(data?: Partial<UpdatePetData>): UpdatePetData {
  return petFaker(data)
}

export function updatePetResponseFaker(_data?: UpdatePetResponse): UpdatePetResponse {
  return faker.helpers.arrayElement<any>([
    updatePetStatus200Faker(),
    updatePetStatus202Faker(),
    updatePetStatus400Faker(),
    updatePetStatus404Faker(),
    updatePetStatus405Faker(),
  ])
}
