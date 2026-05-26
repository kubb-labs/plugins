import type { Address } from './Address.ts'
import type { OrderParams } from './OrderParams.ts'

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
  params?: OrderParams
  /**
   * @type array | undefined
   */
  address?: Array<Address>
}
