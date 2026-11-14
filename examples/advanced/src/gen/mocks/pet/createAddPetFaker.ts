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
export function createAddPetStatusDefaultFakerJson<TData extends Partial<Omit<NonNullable<Pet>, 'name'>> = object>(data?: TData) {
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
export function createAddPetStatusDefaultFaker(data?: Partial<Omit<NonNullable<Pet>, 'name'> | string>): Omit<NonNullable<Pet>, 'name'> | string {
  return (data ?? faker.helpers.arrayElement([createAddPetStatusDefaultFakerJson(), createAddPetStatusDefaultFakerXml()])) as
    | Omit<NonNullable<Pet>, 'name'>
    | string
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
export function createAddPetBodyFakerXml<TData extends Partial<Omit<NonNullable<Pet>, 'id'>> = object>(data?: TData) {
  const { id: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerFormUrlEncoded<TData extends Partial<Omit<NonNullable<Pet>, 'id'>> = object>(data?: TData) {
  const { id: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
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
    | (Omit<NonNullable<Pet>, 'name'> | string)
  >,
):
  | {
      code?: number
      message?: string
    }
  | (Omit<NonNullable<Pet>, 'name'> | string) {
  return faker.helpers.arrayElement([
    () =>
      createAddPetStatus405Faker(
        data as Partial<{
          code?: number
          message?: string
        }>,
      ),
    () => createAddPetStatusDefaultFaker(data as Partial<Omit<NonNullable<Pet>, 'name'> | string>),
  ])() as
    | {
        code?: number
        message?: string
      }
    | (Omit<NonNullable<Pet>, 'name'> | string)
}
