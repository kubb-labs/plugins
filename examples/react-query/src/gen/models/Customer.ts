// version: 1.0.11

import type { Address } from './Address.ts'

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
   * @type array | undefined
   */
  address?: Address[]
}
