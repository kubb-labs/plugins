import type { AddPetRequest } from '../models/ts/AddPetRequest.ts'
import { createAddPetRequestStatusEnumFaker } from './createAddPetRequestStatusEnum.ts'
import { createCategoryFaker } from './createCategory.ts'
import { createTagTagFaker } from './tag/createTag.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createAddPetRequestFaker<TData extends Partial<AddPetRequest> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int(),
    name: faker.string.alpha(),
    category: createCategoryFaker(),
    photoUrls: faker.helpers.multiple(() => faker.string.alpha()),
    tags: faker.helpers.multiple(() => createTagTagFaker()),
    status: createAddPetRequestStatusEnumFaker(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
