import type { OrderParams } from './OrderParams.ts'
import type { OrderParamsStatusEnumKey } from './OrderParamsStatusEnum.ts'

export const orderOrderTypeEnum = {
  foo: 'foo',
  bar: 'bar',
} as const

export type OrderOrderTypeEnumKey = (typeof orderOrderTypeEnum)[keyof typeof orderOrderTypeEnum]

export const orderHttpStatusEnum = {
  ok: 200,
  not_found: 400,
  '500': 500,
} as const

export type OrderHttpStatusEnumKey = (typeof orderHttpStatusEnum)[keyof typeof orderHttpStatusEnum]

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
  params?: OrderParams
  /**
   * @description
   * Format: `int32`
   * @example 7
   * @type integer | undefined
   */
  quantity?: number
  /**
   * @type string | undefined
   */
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
  status?: OrderParamsStatusEnumKey
  /**
   * @description HTTP Status
   * @example 200
   * @type number | undefined
   */
  http_status?: OrderHttpStatusEnumKey
  /**
   * @type boolean | undefined
   */
  complete?: boolean
}
