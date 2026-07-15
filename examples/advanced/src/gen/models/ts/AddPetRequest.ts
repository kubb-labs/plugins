import type { AddPetRequestStatusEnumKey } from './AddPetRequestStatusEnum'
import type { Category } from './Category'
import type { TagTag } from './tag/Tag'

export type AddPetRequest = {
  /**
   * @description
   * Format: `int64`
   * @example 10
   * @type integer | undefined
   */
  id?: number
  /**
   * @example doggie
   * @type string
   */
  name: string
  category?: Category
  photoUrls: Array<string>
  tags?: Array<TagTag>
  /**
   * @description pet status in the store
   */
  status?: AddPetRequestStatusEnumKey
}
