import { faker } from '@faker-js/faker'
import type { TagTag } from '../../models/ts/tag/Tag.ts'

export function createTagTagFaker(data?: Partial<TagTag>): TagTag {
  return {
    ...{ id: faker.number.int(), name: faker.string.alpha() },
    ...(data || {}),
  }
}
