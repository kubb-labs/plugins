import type {
  AddPetData,
  AddPetFormUrlEncodedData,
  AddPetJsonData,
  AddPetResponse,
  AddPetStatus405,
  AddPetStatusDefault,
  AddPetStatusDefaultJson,
  AddPetStatusDefaultXml,
  AddPetXmlData,
} from '../../models/ts/petController/AddPet.ts'
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
export function createAddPetStatusDefaultFakerJson(data?: Partial<AddPetStatusDefaultJson>): AddPetStatusDefaultJson {
  return createPetFaker(data)
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultFakerXml(data?: Partial<AddPetStatusDefaultXml>): AddPetStatusDefaultXml {
  return createPetFaker(data)
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultFaker(_data?: AddPetStatusDefault): AddPetStatusDefault {
  return faker.helpers.arrayElement<any>([createAddPetStatusDefaultFakerJson(), createAddPetStatusDefaultFakerXml()])
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetDataFakerJson(data?: Partial<AddPetJsonData>): AddPetJsonData {
  return createAddPetRequestFaker(data)
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetDataFakerXml(data?: Partial<AddPetXmlData>): AddPetXmlData {
  return createPetFaker(data)
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetDataFakerFormUrlEncoded(data?: Partial<AddPetFormUrlEncodedData>): AddPetFormUrlEncodedData {
  return createPetFaker(data)
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetDataFaker(_data?: AddPetData): AddPetData {
  return faker.helpers.arrayElement<any>([createAddPetDataFakerJson(), createAddPetDataFakerXml(), createAddPetDataFakerFormUrlEncoded()])
}

export function createAddPetResponseFaker(_data?: AddPetResponse): AddPetResponse {
  return faker.helpers.arrayElement<any>([createAddPetStatus405Faker(), createAddPetStatusDefaultFaker()])
}
