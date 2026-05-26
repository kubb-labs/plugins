import type { OrderParamsStatusEnumKey } from './OrderParamsStatusEnum.ts'

/**
 * @type object
 */
export type OrderParams = {
  /**
   * @description Order Status
   * @example approved
   */
  status: OrderParamsStatusEnumKey
  /**
   * @type string
   */
  type: string
}
