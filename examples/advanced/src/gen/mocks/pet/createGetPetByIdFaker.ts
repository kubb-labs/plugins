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
export function createGetPetByIdStatus200FakerJson<TData extends Partial<Omit<NonNullable<Pet>, 'name'>> = object>(data?: TData) {
  const { name: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200FakerXml(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200Faker(data?: Partial<Omit<NonNullable<Pet>, 'name'> | string>): Omit<NonNullable<Pet>, 'name'> | string {
  return (
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? faker.helpers.arrayElement([() => createGetPetByIdStatus200FakerJson(data as Partial<Omit<NonNullable<Pet>, 'name'>>)])()
      : (data ?? faker.helpers.arrayElement([createGetPetByIdStatus200FakerJson(), createGetPetByIdStatus200FakerXml()]))
  ) as Omit<NonNullable<Pet>, 'name'> | string
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

export function createGetPetByIdResponseFaker(data?: Partial<Omit<NonNullable<Pet>, 'name'> | string>): Omit<NonNullable<Pet>, 'name'> | string {
  return createGetPetByIdStatus200Faker(data) as Omit<NonNullable<Pet>, 'name'> | string
}
