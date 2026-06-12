// version: 1.0.11

import type { Category } from './Category.ts'
import type { PetStatusEnumKey } from './PetStatusEnum.ts'

/**
 * @type object
 */
export type Pet = {
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
  /**
   * @type object | undefined
   */
  category?: Category
  /**
   * @type array
   */
  photoUrls: string[]
  /**
   * @type array | undefined
   */
  tags?: Category[]
  /**
   * @description pet status in the store
   */
  status?: PetStatusEnumKey
}
