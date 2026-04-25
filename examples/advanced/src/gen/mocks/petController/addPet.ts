import type { AddPetData, AddPetResponse, AddPetStatus405, AddPetStatusDefault } from '../../models/ts/petController/AddPet.ts'
import { addPetRequestFaker } from '../addPetRequest.ts'
import { petFaker } from '../pet.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Pet not found
 */
export function addPetStatus405(data?: Partial<AddPetStatus405>): Required<AddPetStatus405> {
  const defaultFakeData = { code: faker.number.int(), message: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<AddPetStatus405>
}

/**
 * @description Successful operation
 */
export function addPetStatusDefault(data?: Partial<AddPetStatusDefault>): AddPetStatusDefault {
  return petFaker(data)
}

/**
 * @description Create a new pet in the store
 */
export function addPetData(data?: Partial<AddPetData>): AddPetData {
  return addPetRequestFaker(data)
}

export function addPetResponse(_data?: AddPetResponse): AddPetResponse {
  return faker.helpers.arrayElement<any>([addPetStatus405(), addPetStatusDefault()])
}
