import { faker } from '@faker-js/faker'
import type {
  FindPetsByTagsHeaderXEXAMPLE,
  FindPetsByTagsQueryTags,
  FindPetsByTagsResponse,
  FindPetsByTagsStatus200,
} from '../../models/ts/petController/FindPetsByTags.ts'
import { petFaker } from '../petFaker.ts'

export function findPetsByTagsQueryTagsFaker(data?: FindPetsByTagsQueryTags): FindPetsByTagsQueryTags {
  return [...faker.helpers.multiple(() => faker.string.alpha()), ...(data || [])]
}

export function findPetsByTagsQueryPageFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function findPetsByTagsQueryPageSizeFaker(data?: number): number {
  return data ?? faker.number.float()
}

export function findPetsByTagsHeaderXEXAMPLEFaker(data?: FindPetsByTagsHeaderXEXAMPLE): FindPetsByTagsHeaderXEXAMPLE {
  return data ?? faker.helpers.arrayElement<FindPetsByTagsHeaderXEXAMPLE>(['ONE', 'TWO', 'THREE'])
}

/**
 * @description successful operation
 */
export function findPetsByTagsStatus200Faker(data?: FindPetsByTagsStatus200): FindPetsByTagsStatus200 {
  return [...faker.helpers.multiple(() => petFaker()), ...(data || [])]
}

/**
 * @description Invalid tag value
 */
export function findPetsByTagsStatus400Faker() {
  return undefined
}

export function findPetsByTagsResponseFaker(_data?: FindPetsByTagsResponse): FindPetsByTagsResponse {
  return faker.helpers.arrayElement<any>([findPetsByTagsStatus200Faker(), findPetsByTagsStatus400Faker()])
}
