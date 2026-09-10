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
export function createGetPetByIdStatus200Faker(data?: Partial<GetPetByIdStatus200>): GetPetByIdStatus200 {
  const defaultFakeData: unknown = faker.helpers.arrayElement([createGetPetByIdStatus200FakerJson(), createGetPetByIdStatus200FakerXml()])
  if (data && defaultFakeData && typeof defaultFakeData === 'object' && !Array.isArray(defaultFakeData)) {
    return { ...defaultFakeData, ...data } as GetPetByIdStatus200
  }
  return (data ?? defaultFakeData) as GetPetByIdStatus200
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

export function createGetPetByIdResponseFaker(data?: Partial<GetPetByIdResponse>): GetPetByIdResponse {
  const defaultFakeData: unknown = faker.helpers.arrayElement([
    createGetPetByIdStatus200Faker(),
    createGetPetByIdStatus400Faker(),
    createGetPetByIdStatus404Faker(),
  ])
  if (data && defaultFakeData && typeof defaultFakeData === 'object' && !Array.isArray(defaultFakeData)) {
    return { ...defaultFakeData, ...data } as GetPetByIdResponse
  }
  return (data ?? defaultFakeData) as GetPetByIdResponse
}
