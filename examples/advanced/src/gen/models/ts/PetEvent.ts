import type { Pet } from './Pet'
import type { PetEventTypeEnumKey } from './PetEventTypeEnum'

export type PetEvent = {
  /**
   * @description The kind of change that occurred
   */
  type: PetEventTypeEnumKey
  pet: Pet
  /**
   * @description
   * Format: `date-time`
   * @type string | undefined
   */
  timestamp?: string
}
