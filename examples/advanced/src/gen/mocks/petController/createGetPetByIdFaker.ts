import type { GetPetByIdResponse, GetPetByIdStatus200, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../models/ts/petController/GetPetById.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

export function createGetPetByIdPathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200Faker(data?: Partial<GetPetByIdStatus200>): GetPetByIdStatus200 {
  return createPetFaker(data)
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetByIdStatus400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetByIdStatus404Faker() {
  return undefined
}

export function createGetPetByIdResponseFaker(_data?: GetPetByIdResponse): GetPetByIdResponse {
  return faker.helpers.arrayElement<any>([createGetPetByIdStatus200Faker(), createGetPetByIdStatus400Faker(), createGetPetByIdStatus404Faker()])
}
