import type { Category } from './Category'
import type { PetStatusEnumKey } from './PetStatusEnum'
import type { TagTag } from './tag/Tag'

export type Pet = {
  /**
   * @description
   * Format: `int64`
   * @example 10
   */
  readonly id?: number
  parent?: Array<Pet>
  /**
   * @pattern ^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$
   */
  signature?: string
  /**
   * @example doggie
   */
  name: string
  /**
   * @description
   * Format: `uri`
   * @maxLength 255
   */
  url?: string
  category?: Category
  photoUrls: Array<string>
  tags?: Array<TagTag>
  /**
   * @description pet status in the store
   */
  status?: PetStatusEnumKey
}
