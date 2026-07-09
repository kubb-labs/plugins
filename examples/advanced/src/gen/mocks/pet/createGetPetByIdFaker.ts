import type {
  GetPetByIdPath,
  GetPetByIdResponse,
  GetPetByIdStatus200,
  GetPetByIdStatus200Json,
  GetPetByIdStatus200Xml,
  GetPetByIdStatus400,
  GetPetByIdStatus404,
} from '../../models/ts/pet/GetPetById'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createGetPetByIdPathFaker<TData extends Partial<GetPetByIdPath> = object>(data?: TData) {
  const defaultFakeData = {
    petId: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200FakerJson(data?: Partial<GetPetByIdStatus200Json>): GetPetByIdStatus200Json {
  return createPetFaker(data) as GetPetByIdStatus200Json
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200FakerXml(data?: Partial<GetPetByIdStatus200Xml>): GetPetByIdStatus200Xml {
  return createPetFaker(data) as GetPetByIdStatus200Xml
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200Faker(_data?: GetPetByIdStatus200): GetPetByIdStatus200 {
  return faker.helpers.arrayElement([createGetPetByIdStatus200FakerJson(), createGetPetByIdStatus200FakerXml()])
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
  return faker.helpers.arrayElement([createGetPetByIdStatus200Faker(), createGetPetByIdStatus400Faker(), createGetPetByIdStatus404Faker()])
}
