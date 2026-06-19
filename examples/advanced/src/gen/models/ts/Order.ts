import type { OrderHttpStatusEnumKey } from './OrderHttpStatusEnum.ts'
import type { OrderOrderTypeEnumKey } from './OrderOrderTypeEnum.ts'
import type { OrderParamsStatusEnumKey } from './OrderParamsStatusEnum.ts'
import type { OrderStatusEnumKey } from './OrderStatusEnum.ts'

/**
 * @type object
 */
export type Order = {
  /**
   * @description
   * Format: `int64`
   * @example 10
   * @type integer | undefined
   */
  id?: number
  /**
   * @description
   * Format: `int64`
   * @example 198772
   * @type integer | undefined
   */
  petId?: number
  /**
   * @type object | undefined
   */
  params?: {
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
  /**
   * @description
   * Format: `int32`
   * @example 7
   * @type integer | undefined
   */
  quantity?: number
  orderType?: OrderOrderTypeEnumKey
  /**
   * @description Order Status
   * @example approved
   * @type string | undefined
   */
  type?: string
  /**
   * @description
   * Format: `date-time`
   * @type string | undefined
   */
  shipDate?: string
  /**
   * @description Order Status
   * @example approved
   */
  status?: OrderStatusEnumKey
  /**
   * @description HTTP Status
   * @example 200
   */
  http_status?: OrderHttpStatusEnumKey
  /**
   * @type boolean | undefined
   */
  complete?: boolean
}
