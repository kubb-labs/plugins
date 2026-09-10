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
} from '../../models/ts/pet/AddPet'
import { createAddPetRequestFaker } from '../createAddPetRequestFaker'
import { createPetFaker } from '../createPetFaker'
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
export function createAddPetStatusDefaultFaker(data?: Partial<AddPetStatusDefault>): AddPetStatusDefault {
  const defaultFakeData: unknown = faker.helpers.arrayElement([createAddPetStatusDefaultFakerJson(), createAddPetStatusDefaultFakerXml()])
  if (data && defaultFakeData && typeof defaultFakeData === 'object' && !Array.isArray(defaultFakeData)) {
    return { ...defaultFakeData, ...data } as AddPetStatusDefault
  }
  return (data ?? defaultFakeData) as AddPetStatusDefault
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
export function createAddPetBodyFaker(data?: Partial<AddPetBody>): AddPetBody {
  const defaultFakeData: unknown = faker.helpers.arrayElement([createAddPetBodyFakerJson(), createAddPetBodyFakerXml(), createAddPetBodyFakerFormUrlEncoded()])
  if (data && defaultFakeData && typeof defaultFakeData === 'object' && !Array.isArray(defaultFakeData)) {
    return { ...defaultFakeData, ...data } as AddPetBody
  }
  return (data ?? defaultFakeData) as AddPetBody
}

export function createAddPetResponseFaker(data?: Partial<AddPetResponse>): AddPetResponse {
  const defaultFakeData: unknown = faker.helpers.arrayElement([createAddPetStatus405Faker(), createAddPetStatusDefaultFaker()])
  if (data && defaultFakeData && typeof defaultFakeData === 'object' && !Array.isArray(defaultFakeData)) {
    return { ...defaultFakeData, ...data } as AddPetResponse
  }
  return (data ?? defaultFakeData) as AddPetResponse
}
