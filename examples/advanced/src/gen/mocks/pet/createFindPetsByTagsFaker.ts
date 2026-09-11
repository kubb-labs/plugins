import type {
  FindPetsByTagsHeaders,
  FindPetsByTagsQuery,
  FindPetsByTagsResponse,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus200Json,
  FindPetsByTagsStatus200Xml,
  FindPetsByTagsStatus400,
} from '../../models/ts/pet/FindPetsByTags'
import { createFindPetsByTagsXEXAMPLEFaker } from '../createFindPetsByTagsXEXAMPLEFaker'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createFindPetsByTagsQueryFaker<TData extends Partial<FindPetsByTagsQuery> = object>(data?: TData) {
  const defaultFakeData = {
    tags: faker.helpers.multiple(() => faker.string.alpha()),
    page: faker.string.alpha(),
    pageSize: faker.number.float(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

export function createFindPetsByTagsHeadersFaker<TData extends Partial<FindPetsByTagsHeaders> = object>(data?: TData) {
  const defaultFakeData = {
    'X-EXAMPLE': createFindPetsByTagsXEXAMPLEFaker(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
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
export function createFindPetsByTagsStatus200FakerXml(data?: Partial<FindPetsByTagsStatus200Xml>): FindPetsByTagsStatus200Xml {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || []).filter((item) => item !== undefined)] as FindPetsByTagsStatus200Xml
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

export function createFindPetsByTagsResponseFaker(data?: Partial<FindPetsByTagsResponse>): FindPetsByTagsResponse {
  return (data ?? faker.helpers.arrayElement([createFindPetsByTagsStatus200Faker(), createFindPetsByTagsStatus400Faker()])) as FindPetsByTagsResponse
}
