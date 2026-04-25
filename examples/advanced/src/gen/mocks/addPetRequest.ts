import type { AddPetRequest } from '../models/ts/AddPetRequest.ts'
import { categoryFaker } from './category.ts'
import { tagTagFaker } from './tag/tag.ts'
import { faker } from '@faker-js/faker'

export function addPetRequestFaker(data?: Partial<AddPetRequest>): Required<AddPetRequest> {
  return Object.assign(
    {} as Required<AddPetRequest>,
    {
      id: faker.number.int(),
      name: faker.string.alpha(),
      category: categoryFaker(),
      photoUrls: faker.helpers.multiple(() => faker.string.alpha()),
      tags: faker.helpers.multiple(() => tagTagFaker()),
      status: faker.helpers.arrayElement<any>(['working', 'idle']),
    },
    data,
  )
}
