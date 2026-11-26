import type { FindPetsByTagsXEXAMPLEEnumKey } from '../../models/ts/FindPetsByTagsXEXAMPLEEnum'
import type { Pet } from '../../models/ts/Pet'
import { createFindPetsByTagsXEXAMPLEEnumFaker } from '../createFindPetsByTagsXEXAMPLEEnumFaker'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

type FindPetsByTagsStatus200Json = Array<Pet>

type FindPetsByTagsStatus200 = FindPetsByTagsStatus200Json | string

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
    'X-EXAMPLE': FindPetsByTagsXEXAMPLEEnumKey
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    'X-EXAMPLE': createFindPetsByTagsXEXAMPLEEnumFaker(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200FakerJson(data?: Partial<FindPetsByTagsStatus200Json>): FindPetsByTagsStatus200Json {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || []).filter((item) => item !== undefined)] as FindPetsByTagsStatus200Json
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200FakerXml(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200Faker(data?: Partial<FindPetsByTagsStatus200>): FindPetsByTagsStatus200 {
  return (data ?? faker.helpers.arrayElement([createFindPetsByTagsStatus200FakerJson(), createFindPetsByTagsStatus200FakerXml()])) as FindPetsByTagsStatus200
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTagsStatus400Faker() {
  return undefined
}

export function createFindPetsByTagsResponseFaker(data?: Partial<FindPetsByTagsStatus200>): FindPetsByTagsStatus200 {
  return createFindPetsByTagsStatus200Faker(data) as FindPetsByTagsStatus200
}
