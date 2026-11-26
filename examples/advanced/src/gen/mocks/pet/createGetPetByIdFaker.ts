import type { Pet } from '../../models/ts/Pet'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

type GetPetByIdStatus200Json = Omit<NonNullable<Pet>, 'name'>

type GetPetByIdStatus200 = GetPetByIdStatus200Json | string

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
export function createGetPetByIdStatus200FakerJson<TData extends Partial<GetPetByIdStatus200Json> = object>(data?: TData) {
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
export function createGetPetByIdStatus200Faker(data?: Partial<GetPetByIdStatus200>): GetPetByIdStatus200 {
  return (
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? faker.helpers.arrayElement([() => createGetPetByIdStatus200FakerJson(data as Partial<GetPetByIdStatus200Json>)])()
      : (data ?? faker.helpers.arrayElement([createGetPetByIdStatus200FakerJson(), createGetPetByIdStatus200FakerXml()]))
  ) as GetPetByIdStatus200
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

export function createGetPetByIdResponseFaker(data?: Partial<GetPetByIdStatus200>): GetPetByIdStatus200 {
  return createGetPetByIdStatus200Faker(data) as GetPetByIdStatus200
}
