import type {
  UpdatePetData,
  UpdatePetResponse,
  UpdatePetStatus200,
  UpdatePetStatus202,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../models/ts/petController/UpdatePet.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200Faker(data?: Partial<UpdatePetStatus200>): UpdatePetStatus200 {
  return createPetFaker(data)
}

/**
 * @description accepted operation
 */
export function createUpdatePetStatus202Faker(data?: Partial<UpdatePetStatus202>): Required<UpdatePetStatus202> {
  const defaultFakeData = { id: faker.number.int() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<UpdatePetStatus202>
}

/**
 * @description Invalid ID supplied
 */
export function createUpdatePetStatus400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createUpdatePetStatus404Faker() {
  return undefined
}

/**
 * @description Validation exception
 */
export function createUpdatePetStatus405Faker() {
  return undefined
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetDataFaker(data?: Partial<UpdatePetData>): UpdatePetData {
  return createPetFaker(data)
}

export function createUpdatePetResponseFaker(_data?: UpdatePetResponse): UpdatePetResponse {
  return faker.helpers.arrayElement<any>([
    createUpdatePetStatus200Faker(),
    createUpdatePetStatus202Faker(),
    createUpdatePetStatus400Faker(),
    createUpdatePetStatus404Faker(),
    createUpdatePetStatus405Faker(),
  ])
}
