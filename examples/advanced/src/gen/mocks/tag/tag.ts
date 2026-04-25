import type { TagTag } from '../../models/ts/tag/Tag.ts'
import { faker } from '@faker-js/faker'

export function tagTagFaker(data?: Partial<TagTag>): Required<TagTag> {
  const defaultFakeData = { id: faker.number.int(), name: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<TagTag>
}
