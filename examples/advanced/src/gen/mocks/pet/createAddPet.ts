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
import { createAddPetRequest } from '../createAddPetRequest.ts'
import { createPet } from '../createPet.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Pet not found
 */
export function createAddPetStatus405<TData extends Partial<AddPetStatus405> = object>(data?: TData) {
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
export function createAddPetStatusDefaultJson(data?: Partial<AddPetStatusDefaultJson>): AddPetStatusDefaultJson {
  return createPet(data) as AddPetStatusDefaultJson
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultXml(data?: Partial<AddPetStatusDefaultXml>): AddPetStatusDefaultXml {
  return createPet(data) as AddPetStatusDefaultXml
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefault(_data?: AddPetStatusDefault): AddPetStatusDefault {
  return faker.helpers.arrayElement([createAddPetStatusDefaultJson(), createAddPetStatusDefaultXml()])
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyJson(data?: Partial<AddPetBodyJson>): AddPetBodyJson {
  return createAddPetRequest(data) as AddPetBodyJson
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyXml(data?: Partial<AddPetBodyXml>): AddPetBodyXml {
  return createPet(data) as AddPetBodyXml
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFormUrlEncoded(data?: Partial<AddPetBodyFormUrlEncoded>): AddPetBodyFormUrlEncoded {
  return createPet(data) as AddPetBodyFormUrlEncoded
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBody(_data?: AddPetBody): AddPetBody {
  return faker.helpers.arrayElement([createAddPetBodyJson(), createAddPetBodyXml(), createAddPetBodyFormUrlEncoded()])
}

export function createAddPetResponse(_data?: AddPetResponse): AddPetResponse {
  return faker.helpers.arrayElement([createAddPetStatus405(), createAddPetStatusDefault()])
}
