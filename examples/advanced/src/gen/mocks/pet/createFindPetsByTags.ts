import type {
  FindPetsByTagsHeaderXEXAMPLE,
  FindPetsByTagsQueryTags,
  FindPetsByTagsResponse,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus200Json,
  FindPetsByTagsStatus200Xml,
  FindPetsByTagsStatus400,
} from '../../models/ts/pet/FindPetsByTags.ts'
import { createFindPetsByTagsXEXAMPLE } from '../createFindPetsByTagsXEXAMPLE.ts'
import { createPet } from '../createPet.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createFindPetsByTagsQueryTags(data?: FindPetsByTagsQueryTags): FindPetsByTagsQueryTags {
  return [...faker.helpers.multiple(() => faker.string.alpha()), ...(data || [])]
}

export function createFindPetsByTagsQueryPage(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createFindPetsByTagsQueryPageSize(data?: number): number {
  return data ?? faker.number.float()
}

export function createFindPetsByTagsHeaderXEXAMPLE(data?: Partial<FindPetsByTagsHeaderXEXAMPLE>): FindPetsByTagsHeaderXEXAMPLE {
  return createFindPetsByTagsXEXAMPLE(data) as FindPetsByTagsHeaderXEXAMPLE
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200Json(data?: FindPetsByTagsStatus200Json): FindPetsByTagsStatus200Json {
  return [...faker.helpers.multiple(() => createPet()), ...(data || [])]
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200Xml(data?: FindPetsByTagsStatus200Xml): FindPetsByTagsStatus200Xml {
  return [...faker.helpers.multiple(() => createPet()), ...(data || [])]
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200(_data?: FindPetsByTagsStatus200): FindPetsByTagsStatus200 {
  return faker.helpers.arrayElement([createFindPetsByTagsStatus200Json(), createFindPetsByTagsStatus200Xml()])
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTagsStatus400() {
  return undefined
}

export function createFindPetsByTagsResponse(_data?: FindPetsByTagsResponse): FindPetsByTagsResponse {
  return faker.helpers.arrayElement([createFindPetsByTagsStatus200(), createFindPetsByTagsStatus400()])
}
