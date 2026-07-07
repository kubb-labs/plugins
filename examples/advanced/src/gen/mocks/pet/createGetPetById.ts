import type {
  GetPetByIdResponse,
  GetPetByIdStatus200,
  GetPetByIdStatus200Json,
  GetPetByIdStatus200Xml,
  GetPetByIdStatus400,
  GetPetByIdStatus404,
} from '../../models/ts/pet/GetPetById.ts'
import { createPet } from '../createPet.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createGetPetByIdPathPetId(data?: number): number {
  return data ?? faker.number.int()
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200Json(data?: Partial<GetPetByIdStatus200Json>): GetPetByIdStatus200Json {
  return createPet(data) as GetPetByIdStatus200Json
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200Xml(data?: Partial<GetPetByIdStatus200Xml>): GetPetByIdStatus200Xml {
  return createPet(data) as GetPetByIdStatus200Xml
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200(_data?: GetPetByIdStatus200): GetPetByIdStatus200 {
  return faker.helpers.arrayElement([createGetPetByIdStatus200Json(), createGetPetByIdStatus200Xml()])
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetByIdStatus400() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetByIdStatus404() {
  return undefined
}

export function createGetPetByIdResponse(_data?: GetPetByIdResponse): GetPetByIdResponse {
  return faker.helpers.arrayElement([createGetPetByIdStatus200(), createGetPetByIdStatus400(), createGetPetByIdStatus404()])
}
