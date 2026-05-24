import type {
  FindPetsByTagsHeaderXEXAMPLE,
  FindPetsByTagsQueryTags,
  FindPetsByTagsResponse,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus400,
} from '../../models/ts/petController/FindPetsByTags.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

export function createFindPetsByTagsQueryTagsFaker(data?: FindPetsByTagsQueryTags): FindPetsByTagsQueryTags {
  return [...faker.helpers.multiple(() => faker.string.alpha()), ...(data || [])]
}

export function createFindPetsByTagsQueryPageFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createFindPetsByTagsQueryPageSizeFaker(data?: number): number {
  return data ?? faker.number.float()
}

export function createFindPetsByTagsHeaderXEXAMPLEFaker(data?: FindPetsByTagsHeaderXEXAMPLE): FindPetsByTagsHeaderXEXAMPLE {
  return data ?? faker.helpers.arrayElement<FindPetsByTagsHeaderXEXAMPLE>(['ONE', 'TWO', 'THREE'])
}

/**
 * @description successful operation
 */
export function createFindPetsByTagsStatus200Faker(data?: FindPetsByTagsStatus200): FindPetsByTagsStatus200 {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || [])]
}

/**
 * @description Invalid tag value
 */
export function createFindPetsByTagsStatus400Faker() {
  return undefined
}

export function createFindPetsByTagsResponseFaker(_data?: FindPetsByTagsResponse): FindPetsByTagsResponse {
  return faker.helpers.arrayElement<any>([createFindPetsByTagsStatus200Faker(), createFindPetsByTagsStatus400Faker()])
}
