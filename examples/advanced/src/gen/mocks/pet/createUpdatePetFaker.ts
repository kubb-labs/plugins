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
} from '../../models/ts/pet/UpdatePet'
import { createPetFaker } from '../createPetFaker'
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
export function createUpdatePetStatus200Faker(data?: Partial<UpdatePetStatus200>): UpdatePetStatus200 {
  return (data ?? faker.helpers.arrayElement([createUpdatePetStatus200FakerJson(), createUpdatePetStatus200FakerXml()])) as UpdatePetStatus200
}

/**
 * @description accepted operation
 */
export function createUpdatePetStatus202Faker<TData extends Partial<UpdatePetStatus202> = object>(data?: TData) {
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
export function createUpdatePetBodyFakerJson(data?: Partial<UpdatePetBodyJson>): UpdatePetBodyJson {
  return createPetFaker(data) as UpdatePetBodyJson
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFakerXml(data?: Partial<UpdatePetBodyXml>): UpdatePetBodyXml {
  return createPetFaker(data) as UpdatePetBodyXml
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFakerFormUrlEncoded(data?: Partial<UpdatePetBodyFormUrlEncoded>): UpdatePetBodyFormUrlEncoded {
  return createPetFaker(data) as UpdatePetBodyFormUrlEncoded
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFaker(data?: Partial<UpdatePetBody>): UpdatePetBody {
  return (data ??
    faker.helpers.arrayElement([createUpdatePetBodyFakerJson(), createUpdatePetBodyFakerXml(), createUpdatePetBodyFakerFormUrlEncoded()])) as UpdatePetBody
}

export function createUpdatePetResponseFaker(data?: Partial<UpdatePetResponse>): UpdatePetResponse {
  return (data ??
    faker.helpers.arrayElement([
      createUpdatePetStatus200Faker(),
      createUpdatePetStatus202Faker<object>(),
      createUpdatePetStatus400Faker(),
      createUpdatePetStatus404Faker(),
      createUpdatePetStatus405Faker(),
    ])) as UpdatePetResponse
}
