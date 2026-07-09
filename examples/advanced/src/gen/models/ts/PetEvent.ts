import type { Pet } from './Pet'
import type { PetEventTypeEnumKey } from './PetEventTypeEnum'

/**
 * @type object
 */
export type PetEvent = {
  /**
   * @description The kind of change that occurred
   */
  type: PetEventTypeEnumKey
  /**
   * @type object
   */
  pet: Pet
  /**
   * @description
   * Format: `date-time`
   * @type string | undefined
   */
  timestamp?: string
}
