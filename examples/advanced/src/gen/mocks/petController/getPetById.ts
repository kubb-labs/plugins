import type { GetPetByIdResponse, GetPetByIdStatus200 } from '../../models/ts/petController/GetPetById.ts'
import { petFaker } from '../pet.ts'
import { faker } from '@faker-js/faker'

export function getPetByIdPathPetId(data?: bigint): bigint {
  return data ?? faker.number.bigInt()
}

/**
 * @description successful operation
 */
export function getPetByIdStatus200(data?: Partial<GetPetByIdStatus200>): GetPetByIdStatus200 {
  return petFaker(data)
}

/**
 * @description Invalid ID supplied
 */
export function getPetByIdStatus400() {
  return undefined
}

/**
 * @description Pet not found
 */
export function getPetByIdStatus404() {
  return undefined
}

export function getPetByIdResponse(_data?: GetPetByIdResponse): GetPetByIdResponse {
  return faker.helpers.arrayElement<any>([getPetByIdStatus200(), getPetByIdStatus400(), getPetByIdStatus404()])
}
