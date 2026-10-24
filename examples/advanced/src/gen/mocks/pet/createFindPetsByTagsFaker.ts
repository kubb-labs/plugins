import type { FindPetsByTagsXEXAMPLEKey } from '../../models/ts/FindPetsByTagsXEXAMPLE'
import type { Pet } from '../../models/ts/Pet'
import { createFindPetsByTagsXEXAMPLEFaker } from '../createFindPetsByTagsXEXAMPLEFaker'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createFindPetsByTagsQueryFaker<
  TData extends Partial<{
    tags?: Array<string>
    page?: string
    pageSize?: number
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    tags: faker.helpers.multiple(() => faker.string.alpha()),
    page: faker.string.alpha(),
    pageSize: faker.number.float(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

export function createFindPetsByTagsHeadersFaker<
  TData extends Partial<{
    'X-EXAMPLE': FindPetsByTagsXEXAMPLEKey
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    'X-EXAMPLE': createFindPetsByTagsXEXAMPLEFaker(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200FakerJson(data?: Partial<Array<Pet>>): Array<Pet> {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || []).filter((item) => item !== undefined)] as Array<Pet>
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200FakerXml(data?: Partial<Array<Pet>>): Array<Pet> {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || []).filter((item) => item !== undefined)] as Array<Pet>
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200Faker(data?: Partial<Array<Pet>>): Array<Pet> {
  return (data ?? faker.helpers.arrayElement([createFindPetsByTagsStatus200FakerJson(), createFindPetsByTagsStatus200FakerXml()])) as Array<Pet>
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTagsStatus400Faker() {
  return undefined
}

export function createFindPetsByTagsResponseFaker(data?: Partial<Array<Pet>>): Array<Pet> {
  return (data ?? faker.helpers.arrayElement([createFindPetsByTagsStatus200Faker(), createFindPetsByTagsStatus400Faker()])) as Array<Pet>
}
