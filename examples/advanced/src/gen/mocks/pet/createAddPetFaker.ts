import type { AddPetRequest } from '../../models/ts/AddPetRequest'
import type { Pet } from '../../models/ts/Pet'
import { createAddPetRequestFaker } from '../createAddPetRequestFaker'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Pet not found
 */
export function createAddPetStatus405Faker<
  TData extends Partial<{
    code?: number
    message?: string
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    code: faker.number.int(),
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
export function createAddPetStatusDefaultFakerJson(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return createPetFaker(data) as Omit<NonNullable<Pet>, 'name'>
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultFakerXml(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return createPetFaker(data) as Omit<NonNullable<Pet>, 'name'>
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultFaker(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return (data ?? faker.helpers.arrayElement([createAddPetStatusDefaultFakerJson(), createAddPetStatusDefaultFakerXml()])) as Omit<NonNullable<Pet>, 'name'>
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerJson(data?: Partial<AddPetRequest | Omit<NonNullable<Pet>, 'id'>>): AddPetRequest | Omit<NonNullable<Pet>, 'id'> {
  return createAddPetRequestFaker(data) as AddPetRequest | Omit<NonNullable<Pet>, 'id'>
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerXml(data?: Partial<AddPetRequest | Omit<NonNullable<Pet>, 'id'>>): AddPetRequest | Omit<NonNullable<Pet>, 'id'> {
  return createPetFaker(data) as AddPetRequest | Omit<NonNullable<Pet>, 'id'>
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerFormUrlEncoded(
  data?: Partial<AddPetRequest | Omit<NonNullable<Pet>, 'id'>>,
): AddPetRequest | Omit<NonNullable<Pet>, 'id'> {
  return createPetFaker(data) as AddPetRequest | Omit<NonNullable<Pet>, 'id'>
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFaker(data?: Partial<AddPetRequest | Omit<NonNullable<Pet>, 'id'>>): AddPetRequest | Omit<NonNullable<Pet>, 'id'> {
  return (data ?? faker.helpers.arrayElement([createAddPetBodyFakerJson(), createAddPetBodyFakerXml(), createAddPetBodyFakerFormUrlEncoded()])) as
    | AddPetRequest
    | Omit<NonNullable<Pet>, 'id'>
}

export function createAddPetResponseFaker(
  data?: Partial<
    | {
        code?: number
        message?: string
      }
    | Omit<NonNullable<Pet>, 'name'>
  >,
):
  | {
      code?: number
      message?: string
    }
  | Omit<NonNullable<Pet>, 'name'> {
  return (data ?? faker.helpers.arrayElement([createAddPetStatus405Faker(), createAddPetStatusDefaultFaker()])) as
    | {
        code?: number
        message?: string
      }
    | Omit<NonNullable<Pet>, 'name'>
}
