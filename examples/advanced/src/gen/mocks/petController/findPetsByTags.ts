import type { FindPetsByTagsHeaderXEXAMPLE, FindPetsByTagsQueryTags, FindPetsByTagsResponse, FindPetsByTagsStatus200 } from "../../models/ts/petController/FindPetsByTags.ts";
import { petFaker } from "../pet.ts";
import { faker } from "@faker-js/faker";

export function findPetsByTagsQueryTags(data?: FindPetsByTagsQueryTags): FindPetsByTagsQueryTags {

  return [
    ...faker.helpers.multiple(() => (faker.string.alpha())),
    ...(data || [])
  ]
}

export function findPetsByTagsQueryPage(data?: string): string {

  return data ?? faker.string.alpha()
}

export function findPetsByTagsQueryPageSize(data?: number): number {

  return data ?? faker.number.float()
}

export function findPetsByTagsHeaderXEXAMPLE(data?: FindPetsByTagsHeaderXEXAMPLE): FindPetsByTagsHeaderXEXAMPLE {

  return data ?? faker.helpers.arrayElement<FindPetsByTagsHeaderXEXAMPLE>(["ONE", "TWO", "THREE"])
}

/**
 * @description successful operation
 */
export function findPetsByTagsStatus200(data?: FindPetsByTagsStatus200): FindPetsByTagsStatus200 {

  return [
    ...faker.helpers.multiple(() => (petFaker())),
    ...(data || [])
  ]
}

/**
 * @description Invalid tag value
 */
export function findPetsByTagsStatus400() {

  return undefined
}

export function findPetsByTagsResponse(_data?: FindPetsByTagsResponse): FindPetsByTagsResponse {

  return faker.helpers.arrayElement<any>([findPetsByTagsStatus200(), findPetsByTagsStatus400()])
}