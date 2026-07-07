import type { Pet } from '../models/ts/Pet.ts'
import { createCategory } from './createCategory.ts'
import { createTagTag } from './tag/createTag.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createPet<TData extends Partial<Pet> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int(),
    parent: faker.helpers.multiple(() => undefined as unknown as NonNullable<NonNullable<Pet>['parent']>[number]),
    signature: faker.helpers.fromRegExp('^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$'),
    name: faker.string.alpha(),
    url: faker.internet.url(),
    category: createCategory(),
    photoUrls: faker.helpers.multiple(() => faker.string.alpha()),
    tags: faker.helpers.multiple(() => createTagTag()),
    status: faker.helpers.arrayElement<NonNullable<Pet>['status']>(['available', 'pending']),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
