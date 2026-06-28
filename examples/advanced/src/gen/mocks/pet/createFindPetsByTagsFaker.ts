import type {
  FindPetsByTagsHeaderXEXAMPLE,
  FindPetsByTagsQueryTags,
  FindPetsByTagsResponse,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus200Json,
  FindPetsByTagsStatus200Xml,
  FindPetsByTagsStatus400,
} from '../../models/ts/pet/FindPetsByTags.ts'
import { createFindPetsByTagsXEXAMPLEFaker } from '../createFindPetsByTagsXEXAMPLEFaker.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createFindPetsByTagsQueryTagsFaker(data?: FindPetsByTagsQueryTags): FindPetsByTagsQueryTags {
  return [...faker.helpers.multiple(() => faker.string.alpha()), ...(data || [])]
}

export function createFindPetsByTagsQueryPageFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createFindPetsByTagsQueryPageSizeFaker(data?: number): number {
  return data ?? faker.number.float()
}

export function createFindPetsByTagsHeaderXEXAMPLEFaker(data?: Partial<FindPetsByTagsHeaderXEXAMPLE>): FindPetsByTagsHeaderXEXAMPLE {
  return createFindPetsByTagsXEXAMPLEFaker(data) as FindPetsByTagsHeaderXEXAMPLE
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
