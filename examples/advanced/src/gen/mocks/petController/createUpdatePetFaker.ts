import type {
  UpdatePetData,
  UpdatePetFormUrlEncodedData,
  UpdatePetJsonData,
  UpdatePetResponse,
  UpdatePetStatus200,
  UpdatePetStatus200Json,
  UpdatePetStatus200Xml,
  UpdatePetStatus202,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
  UpdatePetXmlData,
} from '../../models/ts/petController/UpdatePet.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200FakerJson(data?: Partial<UpdatePetStatus200Json>): UpdatePetStatus200Json {
  return createPetFaker(data) as UpdatePetStatus200Json
}

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200FakerXml(data?: Partial<UpdatePetStatus200Xml>): UpdatePetStatus200Xml {
  return createPetFaker(data) as UpdatePetStatus200Xml
}

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200Faker(_data?: UpdatePetStatus200): UpdatePetStatus200 {
  return faker.helpers.arrayElement<any>([createUpdatePetStatus200FakerJson(), createUpdatePetStatus200FakerXml()])
}

/**
 * @description accepted operation
 */
export function createUpdatePetStatus202Faker<TData extends Partial<UpdatePetStatus202> = object>(data?: TData) {
  const defaultFakeData = { id: faker.number.int() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
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
export function createUpdatePetDataFakerJson(data?: Partial<UpdatePetJsonData>): UpdatePetJsonData {
  return createPetFaker(data) as UpdatePetJsonData
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetDataFakerXml(data?: Partial<UpdatePetXmlData>): UpdatePetXmlData {
  return createPetFaker(data) as UpdatePetXmlData
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetDataFakerFormUrlEncoded(data?: Partial<UpdatePetFormUrlEncodedData>): UpdatePetFormUrlEncodedData {
  return createPetFaker(data) as UpdatePetFormUrlEncodedData
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetDataFaker(_data?: UpdatePetData): UpdatePetData {
  return faker.helpers.arrayElement<any>([createUpdatePetDataFakerJson(), createUpdatePetDataFakerXml(), createUpdatePetDataFakerFormUrlEncoded()])
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
