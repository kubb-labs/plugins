import type { FindPetsByTagsHeaderXEXAMPLE, FindPetsByTagsQueryTags } from '../../models/ts/petController/FindPetsByTags.ts'
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
