import type {
  FindPetsByTagsHeaders,
  FindPetsByTagsQuery,
  FindPetsByTagsResponse,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus200Json,
  FindPetsByTagsStatus200Xml,
  FindPetsByTagsStatus400,
} from '../../models/ts/pet/FindPetsByTags.ts'
import { createFindPetsByTagsXEXAMPLEFaker } from '../createFindPetsByTagsXEXAMPLEFaker.ts'
import { createPetFaker } from '../createPetFaker.ts'
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
    xEXAMPLE: createFindPetsByTagsXEXAMPLEFaker(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200FakerJson(data?: FindPetsByTagsStatus200Json): FindPetsByTagsStatus200Json {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || [])]
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200FakerXml(data?: FindPetsByTagsStatus200Xml): FindPetsByTagsStatus200Xml {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || [])]
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200Faker(_data?: FindPetsByTagsStatus200): FindPetsByTagsStatus200 {
  return faker.helpers.arrayElement([createFindPetsByTagsStatus200FakerJson(), createFindPetsByTagsStatus200FakerXml()])
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTagsStatus400Faker() {
  return undefined
}

export function createFindPetsByTagsResponseFaker(_data?: FindPetsByTagsResponse): FindPetsByTagsResponse {
  return faker.helpers.arrayElement([createFindPetsByTagsStatus200Faker(), createFindPetsByTagsStatus400Faker()])
}
