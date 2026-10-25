import type { Pet } from '../../models/ts/Pet'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createFindPetsByStatusPathFaker<
  TData extends Partial<{
    step_id: string
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    step_id: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200FakerJson(data?: Partial<Array<Pet>>): Array<Pet> {
  return [...faker.helpers.multiple(() => createPetFaker(), { count: { min: 1, max: 3 } }), ...(data || []).filter((item) => item !== undefined)] as Array<Pet>
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200FakerXml(data?: Partial<Array<Pet>>): Array<Pet> {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || []).filter((item) => item !== undefined)] as Array<Pet>
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200Faker(data?: Partial<Array<Pet>>): Array<Pet> {
  return (data ?? faker.helpers.arrayElement([createFindPetsByStatusStatus200FakerJson(), createFindPetsByStatusStatus200FakerXml()])) as Array<Pet>
}

/**
 * @description Invalid status value
 */
export function createFindPetsByStatusStatus400Faker() {
  return undefined
}

export function createFindPetsByStatusResponseFaker(data?: Partial<Array<Pet>>): Array<Pet> {
  return (data ?? faker.helpers.arrayElement([createFindPetsByStatusStatus200Faker(), createFindPetsByStatusStatus400Faker()])) as Array<Pet>
}
