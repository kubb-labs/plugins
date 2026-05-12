import type { AddPetRequest } from '../models/ts/AddPetRequest.ts'
import { createCategoryFaker } from './createCategoryFaker.ts'
import { createTagTagFaker } from './tag/createTagFaker.ts'
import { faker } from '@faker-js/faker'

export function createAddPetRequestFaker(data?: Partial<AddPetRequest>): Required<AddPetRequest> {
  const defaultFakeData = {
    id: faker.number.int(),
    name: faker.string.alpha(),
    category: createCategoryFaker(),
    photoUrls: faker.helpers.multiple(() => faker.string.alpha()),
    tags: faker.helpers.multiple(() => createTagTagFaker()),
    status: faker.helpers.arrayElement<any>(['working', 'idle']),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<AddPetRequest>
}
