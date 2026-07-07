import type {
  UpdatePetBody,
  UpdatePetBodyFormUrlEncoded,
  UpdatePetBodyJson,
  UpdatePetBodyXml,
  UpdatePetResponse,
  UpdatePetStatus200,
  UpdatePetStatus200Json,
  UpdatePetStatus200Xml,
  UpdatePetStatus202,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../models/ts/pet/UpdatePet.ts'
import { createPet } from '../createPet.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200Json(data?: Partial<UpdatePetStatus200Json>): UpdatePetStatus200Json {
  return createPet(data) as UpdatePetStatus200Json
}

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200Xml(data?: Partial<UpdatePetStatus200Xml>): UpdatePetStatus200Xml {
  return createPet(data) as UpdatePetStatus200Xml
}

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200(_data?: UpdatePetStatus200): UpdatePetStatus200 {
  return faker.helpers.arrayElement([createUpdatePetStatus200Json(), createUpdatePetStatus200Xml()])
}

/**
 * @description accepted operation
 */
export function createUpdatePetStatus202<TData extends Partial<UpdatePetStatus202> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

/**
 * @description Invalid ID supplied
 */
export function createUpdatePetStatus400() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createUpdatePetStatus404() {
  return undefined
}

/**
 * @description Validation exception
 */
export function createUpdatePetStatus405() {
  return undefined
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyJson(data?: Partial<UpdatePetBodyJson>): UpdatePetBodyJson {
  return createPet(data) as UpdatePetBodyJson
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyXml(data?: Partial<UpdatePetBodyXml>): UpdatePetBodyXml {
  return createPet(data) as UpdatePetBodyXml
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFormUrlEncoded(data?: Partial<UpdatePetBodyFormUrlEncoded>): UpdatePetBodyFormUrlEncoded {
  return createPet(data) as UpdatePetBodyFormUrlEncoded
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBody(_data?: UpdatePetBody): UpdatePetBody {
  return faker.helpers.arrayElement([createUpdatePetBodyJson(), createUpdatePetBodyXml(), createUpdatePetBodyFormUrlEncoded()])
}

export function createUpdatePetResponse(_data?: UpdatePetResponse): UpdatePetResponse {
  return faker.helpers.arrayElement([
    createUpdatePetStatus200(),
    createUpdatePetStatus202(),
    createUpdatePetStatus400(),
    createUpdatePetStatus404(),
    createUpdatePetStatus405(),
  ])
}
