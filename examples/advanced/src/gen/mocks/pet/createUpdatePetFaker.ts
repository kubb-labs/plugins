import type { Pet } from '../../models/ts/Pet'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200FakerJson<TData extends Partial<Omit<NonNullable<Pet>, 'name'>> = object>(data?: TData) {
  const { name: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200FakerXml<TData extends Partial<Omit<NonNullable<Pet>, 'name'>> = object>(data?: TData) {
  const { name: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200Faker(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return (data ?? faker.helpers.arrayElement([createUpdatePetStatus200FakerJson(), createUpdatePetStatus200FakerXml()])) as Omit<NonNullable<Pet>, 'name'>
}

/**
 * @description accepted operation
 */
export function createUpdatePetStatus202Faker<
  TData extends Partial<{
    id?: number
  }> = object,
>(data?: TData) {
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
export function createUpdatePetBodyFakerJson<TData extends Partial<Omit<NonNullable<Pet>, 'id'>> = object>(data?: TData) {
  const { id: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFakerXml<TData extends Partial<Omit<NonNullable<Pet>, 'id'>> = object>(data?: TData) {
  const { id: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFakerFormUrlEncoded<TData extends Partial<Omit<NonNullable<Pet>, 'id'>> = object>(data?: TData) {
  const { id: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFaker(data?: Partial<Omit<NonNullable<Pet>, 'id'>>): Omit<NonNullable<Pet>, 'id'> {
  return (data ??
    faker.helpers.arrayElement([createUpdatePetBodyFakerJson(), createUpdatePetBodyFakerXml(), createUpdatePetBodyFakerFormUrlEncoded()])) as Omit<
    NonNullable<Pet>,
    'id'
  >
}

export function createUpdatePetResponseFaker(
  data?: Partial<
    | Omit<NonNullable<Pet>, 'name'>
    | {
        id?: number
      }
  >,
):
  | Omit<NonNullable<Pet>, 'name'>
  | {
      id?: number
    } {
  return (data ??
    faker.helpers.arrayElement([
      createUpdatePetStatus200Faker(),
      createUpdatePetStatus202Faker(),
      createUpdatePetStatus400Faker(),
      createUpdatePetStatus404Faker(),
      createUpdatePetStatus405Faker(),
    ])) as
    | Omit<NonNullable<Pet>, 'name'>
    | {
        id?: number
      }
}
