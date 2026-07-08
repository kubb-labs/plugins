/**
 * @type object
 */
export type DeleteOrderPath = {
  /**
   * @description ID of the order that needs to be deleted
   *
   * Format: `int64`
   * @type integer
   */
  orderId: number
}

/**
 * @type unknown
 */
export type DeleteOrderStatus400 = unknown

/**
 * @type unknown
 */
export type DeleteOrderStatus404 = unknown

/**
 * @type object
 */
export type DeleteOrderOptions = {
  body?: never
  path: DeleteOrderPath
  query?: never
  headers?: never
}

/**
 * @type object
 */
export type DeleteOrderResponses = {
  '400': DeleteOrderStatus400
  '404': DeleteOrderStatus404
}

/**
 * @description Union of all possible responses
 */
export type DeleteOrderResponse = DeleteOrderStatus400 | DeleteOrderStatus404
