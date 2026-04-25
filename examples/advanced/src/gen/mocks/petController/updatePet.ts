import type { UpdatePetData, UpdatePetResponse, UpdatePetStatus200, UpdatePetStatus202 } from '../../models/ts/petController/UpdatePet.ts'
import { petFaker } from '../pet.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function updatePetStatus200(data?: Partial<UpdatePetStatus200>): UpdatePetStatus200 {
  return petFaker(data)
}

/**
 * @description accepted operation
 */
export function updatePetStatus202(data?: Partial<UpdatePetStatus202>): Required<UpdatePetStatus202> {
  return Object.assign({} as Required<UpdatePetStatus202>, { id: faker.number.int() }, data)
}

/**
 * @description Invalid ID supplied
 */
export function updatePetStatus400() {
  return undefined
}

/**
 * @description Pet not found
 */
export function updatePetStatus404() {
  return undefined
}

/**
 * @description Validation exception
 */
export function updatePetStatus405() {
  return undefined
}

/**
 * @description Update an existent pet in the store
 */
export function updatePetData(data?: Partial<UpdatePetData>): UpdatePetData {
  return petFaker(data)
}

export function updatePetResponse(_data?: UpdatePetResponse): UpdatePetResponse {
  return faker.helpers.arrayElement<any>([updatePetStatus200(), updatePetStatus202(), updatePetStatus400(), updatePetStatus404(), updatePetStatus405()])
}
