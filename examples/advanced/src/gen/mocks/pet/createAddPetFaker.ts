import type {
  AddPetBody,
  AddPetBodyFormUrlEncoded,
  AddPetBodyJson,
  AddPetBodyXml,
  AddPetResponse,
  AddPetStatus405,
  AddPetStatusDefault,
  AddPetStatusDefaultJson,
  AddPetStatusDefaultXml,
} from '../../models/ts/pet/AddPet.ts'
import { createAddPetRequestFaker } from '../createAddPetRequestFaker.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Pet not found
 */
export function createAddPetStatus405Faker<TData extends Partial<AddPetStatus405> = object>(data?: TData) {
  const defaultFakeData = {
    code: faker.number.int(),
    message: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultFakerJson(data?: Partial<AddPetStatusDefaultJson>): AddPetStatusDefaultJson {
  return createPetFaker(data) as AddPetStatusDefaultJson
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultFakerXml(data?: Partial<AddPetStatusDefaultXml>): AddPetStatusDefaultXml {
  return createPetFaker(data) as AddPetStatusDefaultXml
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultFaker(_data?: AddPetStatusDefault): AddPetStatusDefault {
  return faker.helpers.arrayElement([createAddPetStatusDefaultFakerJson(), createAddPetStatusDefaultFakerXml()])
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerJson(data?: Partial<AddPetBodyJson>): AddPetBodyJson {
  return createAddPetRequestFaker(data) as AddPetBodyJson
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerXml(data?: Partial<AddPetBodyXml>): AddPetBodyXml {
  return createPetFaker(data) as AddPetBodyXml
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerFormUrlEncoded(data?: Partial<AddPetBodyFormUrlEncoded>): AddPetBodyFormUrlEncoded {
  return createPetFaker(data) as AddPetBodyFormUrlEncoded
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFaker(_data?: AddPetBody): AddPetBody {
  return faker.helpers.arrayElement([createAddPetBodyFakerJson(), createAddPetBodyFakerXml(), createAddPetBodyFakerFormUrlEncoded()])
}

export function createAddPetResponseFaker(_data?: AddPetResponse): AddPetResponse {
  return faker.helpers.arrayElement([createAddPetStatus405Faker(), createAddPetStatusDefaultFaker()])
}
