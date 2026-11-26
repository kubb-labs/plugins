import type { Pet } from '../../models/ts/Pet'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

type FindPetsByStatusStatus200Json = Array<Pet>

type FindPetsByStatusStatus200 = FindPetsByStatusStatus200Json | string

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
export function createFindPetsByStatusStatus200FakerJson(data?: Partial<FindPetsByStatusStatus200Json>): FindPetsByStatusStatus200Json {
  return [
    ...faker.helpers.uniqueArray(() => createPetFaker(), faker.number.int({ min: 1, max: 3 })),
    ...(data || []).filter((item) => item !== undefined),
  ] as FindPetsByStatusStatus200Json
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200FakerXml(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200Faker(data?: Partial<FindPetsByStatusStatus200>): FindPetsByStatusStatus200 {
  return (data ??
    faker.helpers.arrayElement([createFindPetsByStatusStatus200FakerJson(), createFindPetsByStatusStatus200FakerXml()])) as FindPetsByStatusStatus200
}

/**
 * @description Invalid status value
 */
export function createFindPetsByStatusStatus400Faker() {
  return undefined
}

export function createFindPetsByStatusResponseFaker(data?: Partial<FindPetsByStatusStatus200>): FindPetsByStatusStatus200 {
  return createFindPetsByStatusStatus200Faker(data) as FindPetsByStatusStatus200
}
