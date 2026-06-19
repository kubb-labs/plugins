import type { Address } from './Address.ts'
import type { CustomerParamsStatusEnumKey } from './CustomerParamsStatusEnum.ts'

/**
 * @type object
 */
export type Customer = {
  /**
   * @description
   * Format: `int64`
   * @example 100000
   * @type integer | undefined
   */
  id?: number
  /**
   * @example fehguy
   * @type string | undefined
   */
  username?: string
  /**
   * @type object | undefined
   */
  params?: {
    /**
     * @description Order Status
     * @example approved
     */
    status: CustomerParamsStatusEnumKey
    /**
     * @type string
     */
    type: string
  }
  /**
   * @type array | undefined
   */
  address?: Array<Address>
}
