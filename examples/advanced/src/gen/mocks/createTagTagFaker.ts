import type { TagTag } from '../models/ts/tag/Tag'
import { fakerEN as faker } from '@faker-js/faker'

export function createTagTagFaker<TData extends Partial<TagTag> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int(),
    name: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
