import type { Pet } from '../../models/ts/Pet'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

type UpdatePetStatus200Json = Omit<NonNullable<Pet>, 'name'>

type UpdatePetStatus200 = UpdatePetStatus200Json | string

type UpdatePetStatus202 = {
  id?: number
}

type UpdatePetBodyJson = Omit<NonNullable<Pet>, 'id'>

type UpdatePetBodyXml = Omit<NonNullable<Pet>, 'id'>

type UpdatePetBodyFormUrlEncoded = Omit<NonNullable<Pet>, 'id'>

type UpdatePetResponse = UpdatePetStatus200 | UpdatePetStatus202

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200FakerJson<TData extends Partial<UpdatePetStatus200Json> = object>(data?: TData) {
  const { name: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200FakerXml(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200Faker(data?: Partial<UpdatePetStatus200>): UpdatePetStatus200 {
  return (
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? faker.helpers.arrayElement([() => createUpdatePetStatus200FakerJson(data as Partial<UpdatePetStatus200Json>)])()
      : (data ?? faker.helpers.arrayElement([createUpdatePetStatus200FakerJson(), createUpdatePetStatus200FakerXml()]))
  ) as UpdatePetStatus200
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
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
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
export function createUpdatePetBodyFakerJson<TData extends Partial<UpdatePetBodyJson> = object>(data?: TData) {
  const { id: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFakerXml<TData extends Partial<UpdatePetBodyXml> = object>(data?: TData) {
  const { id: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFakerFormUrlEncoded<TData extends Partial<UpdatePetBodyFormUrlEncoded> = object>(data?: TData) {
  const { id: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFaker(data?: Partial<UpdatePetBodyJson>): UpdatePetBodyJson {
  return (
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? faker.helpers.arrayElement([
          () => createUpdatePetBodyFakerJson(data as Partial<UpdatePetBodyJson>),
          () => createUpdatePetBodyFakerXml(data as Partial<UpdatePetBodyXml>),
          () => createUpdatePetBodyFakerFormUrlEncoded(data as Partial<UpdatePetBodyFormUrlEncoded>),
        ])()
      : (data ?? faker.helpers.arrayElement([createUpdatePetBodyFakerJson(), createUpdatePetBodyFakerXml(), createUpdatePetBodyFakerFormUrlEncoded()]))
  ) as UpdatePetBodyJson
}

export function createUpdatePetResponseFaker(data?: Partial<UpdatePetResponse>): UpdatePetResponse {
  return (
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? faker.helpers.arrayElement([
          () => createUpdatePetStatus200Faker(data as Partial<UpdatePetStatus200>),
          () => createUpdatePetStatus202Faker(data as Partial<UpdatePetStatus202>),
        ])()
      : (data ?? faker.helpers.arrayElement([createUpdatePetStatus200Faker(), createUpdatePetStatus202Faker()]))
  ) as UpdatePetResponse
}
