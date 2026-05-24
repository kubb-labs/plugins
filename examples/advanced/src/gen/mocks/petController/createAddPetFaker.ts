import type { AddPetData, AddPetResponse, AddPetStatus405, AddPetStatusDefault } from '../../models/ts/petController/AddPet.ts'
import { createAddPetRequestFaker } from '../createAddPetRequestFaker.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Pet not found
 */
export function createAddPetStatus405Faker(data?: Partial<AddPetStatus405>): Required<AddPetStatus405> {
  const defaultFakeData = { code: faker.number.int(), message: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<AddPetStatus405>
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultFaker(data?: Partial<AddPetStatusDefault>): AddPetStatusDefault {
  return createPetFaker(data)
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetDataFaker(data?: Partial<AddPetData>): AddPetData {
  return createAddPetRequestFaker(data)
}

export function createAddPetResponseFaker(_data?: AddPetResponse): AddPetResponse {
  return faker.helpers.arrayElement<any>([createAddPetStatus405Faker(), createAddPetStatusDefaultFaker()])
}
