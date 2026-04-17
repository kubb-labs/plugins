import type { GetPetByIdResponse, GetPetByIdStatus200 } from '../../models/ts/petController/GetPetById.ts'
import { petFaker } from '../petFaker.ts'
import { faker } from '@faker-js/faker'

export function getPetByIdPathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}

/**
 * @description successful operation
 */
export function getPetByIdStatus200Faker(data?: Partial<GetPetByIdStatus200>): GetPetByIdStatus200 {
  return petFaker(data)
}

/**
 * @description Invalid ID supplied
 */
export function getPetByIdStatus400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function getPetByIdStatus404Faker() {
  return undefined
}

export function getPetByIdResponseFaker(_data?: GetPetByIdResponse): GetPetByIdResponse {
  return faker.helpers.arrayElement<any>([getPetByIdStatus200Faker(), getPetByIdStatus400Faker(), getPetByIdStatus404Faker()])
}
