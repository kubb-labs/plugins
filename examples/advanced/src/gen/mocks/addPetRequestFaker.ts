import type { AddPetRequest } from '../models/ts/AddPetRequest.ts'
import { categoryFaker } from './categoryFaker.ts'
import { tagTagFaker } from './tag/tagFaker.ts'
import { faker } from '@faker-js/faker'

export function addPetRequestFaker(data?: Partial<AddPetRequest>): AddPetRequest {
  return {
    ...{
      id: faker.number.int(),
      name: faker.string.alpha(),
      category: categoryFaker(),
      photoUrls: faker.helpers.multiple(() => faker.string.alpha()),
      tags: faker.helpers.multiple(() => tagTagFaker()),
      status: faker.helpers.arrayElement<any>(['working', 'idle']),
    },
    ...(data || {}),
  }
}
