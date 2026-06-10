// version: 1.0.11

export const orderStatusEnum = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type OrderStatusEnumKey = (typeof orderStatusEnum)[keyof typeof orderStatusEnum]

export const orderHttpStatusEnum = {
  '200': 200,
  '400': 400,
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
  /**
   * @description
   * Format: `int32`
   * @example 7
   * @type integer | undefined
   */
  quantity?: number
  /**
   * @description
   * Format: `date-time`
   * @type string | undefined
   */
  shipDate?: string
  /**
   * @description Order Status
   * @example approved
   * @type string | undefined
   */
  status?: OrderStatusEnumKey
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
