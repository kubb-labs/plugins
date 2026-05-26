import type { TagTag } from '../../models/ts/tag/Tag.ts'
import { createCategoryFaker } from '../createCategoryFaker.ts'

export function createTagTagFaker(data?: Partial<TagTag>): TagTag {
  return createCategoryFaker(data) as TagTag
}
