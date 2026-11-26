import type { AddPetRequest } from '../../models/ts/AddPetRequest'
import type { Pet } from '../../models/ts/Pet'
import { createAddPetRequestFaker } from '../createAddPetRequestFaker'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

type AddPetStatus405 = {
  code?: number
  message?: string
}

type AddPetStatusDefaultJson = Omit<NonNullable<Pet>, 'name'>

type AddPetStatusDefault = AddPetStatusDefaultJson | string

type AddPetBodyXml = Omit<NonNullable<Pet>, 'id'>

type AddPetBodyFormUrlEncoded = Omit<NonNullable<Pet>, 'id'>

type AddPetBody = AddPetRequest | AddPetBodyXml

type AddPetResponse = AddPetStatus405 | AddPetStatusDefault

/**
 * @description Pet not found
 */
export function createAddPetStatus405Faker<TData extends Partial<AddPetStatus405> = object>(data?: TData) {
  const defaultFakeData = {
    code: faker.number.int({ max: 2147483647 }),
    message: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultFakerJson<TData extends Partial<AddPetStatusDefaultJson> = object>(data?: TData) {
  const { name: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultFakerXml(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultFaker(data?: Partial<AddPetStatusDefault>): AddPetStatusDefault {
  return (
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? faker.helpers.arrayElement([() => createAddPetStatusDefaultFakerJson(data as Partial<AddPetStatusDefaultJson>)])()
      : (data ?? faker.helpers.arrayElement([createAddPetStatusDefaultFakerJson(), createAddPetStatusDefaultFakerXml()]))
  ) as AddPetStatusDefault
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerJson(data?: Partial<AddPetRequest>): AddPetRequest {
  return createAddPetRequestFaker(data) as AddPetRequest
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerXml<TData extends Partial<AddPetBodyXml> = object>(data?: TData) {
  const { id: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerFormUrlEncoded<TData extends Partial<AddPetBodyFormUrlEncoded> = object>(data?: TData) {
  const { id: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFaker(data?: Partial<AddPetBody>): AddPetBody {
  return (
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? faker.helpers.arrayElement([
          () => createAddPetBodyFakerJson(data as Partial<AddPetRequest>),
          () => createAddPetBodyFakerXml(data as Partial<AddPetBodyXml>),
          () => createAddPetBodyFakerFormUrlEncoded(data as Partial<AddPetBodyFormUrlEncoded>),
        ])()
      : (data ?? faker.helpers.arrayElement([createAddPetBodyFakerJson(), createAddPetBodyFakerXml(), createAddPetBodyFakerFormUrlEncoded()]))
  ) as AddPetBody
}

export function createAddPetResponseFaker(data?: Partial<AddPetResponse>): AddPetResponse {
  return (
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? faker.helpers.arrayElement([
          () => createAddPetStatus405Faker(data as Partial<AddPetStatus405>),
          () => createAddPetStatusDefaultFaker(data as Partial<AddPetStatusDefault>),
        ])()
      : (data ?? faker.helpers.arrayElement([createAddPetStatus405Faker(), createAddPetStatusDefaultFaker()]))
  ) as AddPetResponse
}
