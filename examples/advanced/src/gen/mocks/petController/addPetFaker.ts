import { faker } from '@faker-js/faker'
import type { AddPetData, AddPetResponse, AddPetStatus405, AddPetStatusDefault } from '../../models/ts/petController/AddPet.ts'
import { addPetRequestFaker } from '../addPetRequestFaker.ts'
import { petFaker } from '../petFaker.ts'

/**
 * @description Pet not found
 */
export function addPetStatus405Faker(data?: Partial<AddPetStatus405>): AddPetStatus405 {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description Successful operation
 */
export function addPetStatusDefaultFaker(data?: Partial<AddPetStatusDefault>): AddPetStatusDefault {
  return petFaker(data)
}

/**
 * @description Create a new pet in the store
 */
export function addPetDataFaker(data?: Partial<AddPetData>): AddPetData {
  return addPetRequestFaker(data)
}

export function addPetResponseFaker(_data?: AddPetResponse): AddPetResponse {
  return faker.helpers.arrayElement<any>([addPetStatus405Faker(), addPetStatusDefaultFaker()])
}
