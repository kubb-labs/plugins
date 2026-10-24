import type { Pet } from '../../models/ts/Pet'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createGetPetByIdPathFaker<
  TData extends Partial<{
    petId: number
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    petId: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200FakerJson(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return createPetFaker(data) as Omit<NonNullable<Pet>, 'name'>
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200FakerXml(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return createPetFaker(data) as Omit<NonNullable<Pet>, 'name'>
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200Faker(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return (data ?? faker.helpers.arrayElement([createGetPetByIdStatus200FakerJson(), createGetPetByIdStatus200FakerXml()])) as Omit<NonNullable<Pet>, 'name'>
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetByIdStatus400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetByIdStatus404Faker() {
  return undefined
}

export function createGetPetByIdResponseFaker(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return (data ?? faker.helpers.arrayElement([createGetPetByIdStatus200Faker(), createGetPetByIdStatus400Faker(), createGetPetByIdStatus404Faker()])) as Omit<
    NonNullable<Pet>,
    'name'
  >
}
