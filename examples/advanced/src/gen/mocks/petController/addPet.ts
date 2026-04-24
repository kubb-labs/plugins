import type { AddPetResponse, AddPetStatus405, AddPetStatusDefault } from '../../models/ts/petController/AddPet.ts'
import { petFaker } from '../pet.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Pet not found
 */
export function addPetStatus405(data?: Partial<AddPetStatus405>): AddPetStatus405 {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description Successful operation
 */
export function addPetStatusDefault(data?: Partial<AddPetStatusDefault>): AddPetStatusDefault {
  return petFaker(data)
}

export function addPetResponse(_data?: AddPetResponse): AddPetResponse {
  return faker.helpers.arrayElement<any>([addPetStatus405(), addPetStatusDefault()])
}
