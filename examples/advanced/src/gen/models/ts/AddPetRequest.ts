import type { Category } from './Category.ts'
import type { PetStatusEnumKey } from './PetStatusEnum.ts'

/**
 * @type object
 */
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
  /**
   * @type object | undefined
   */
  category?: Category
  /**
   * @type array
   */
  photoUrls: Array<string>
  /**
   * @type array | undefined
   */
  tags?: Array<Category>
  /**
   * @description pet status in the store
   */
  status?: PetStatusEnumKey
}
