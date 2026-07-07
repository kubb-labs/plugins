import type { AddPetRequest } from '../models/ts/AddPetRequest.ts'
import { createAddPetRequestStatusEnum } from './createAddPetRequestStatusEnum.ts'
import { createCategory } from './createCategory.ts'
import { createTagTag } from './tag/createTag.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createAddPetRequest<TData extends Partial<AddPetRequest> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int(),
    name: faker.string.alpha(),
    category: createCategory(),
    photoUrls: faker.helpers.multiple(() => faker.string.alpha()),
    tags: faker.helpers.multiple(() => createTagTag()),
    status: createAddPetRequestStatusEnum(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
