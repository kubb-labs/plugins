// version: 1.0.11

import type { Order } from './Order.ts'

/**
 * @type object
 */
export type PlaceOrderStatus200 = Order

/**
 * @type any
 */
export type PlaceOrderStatus405 = any

/**
 * @type object
 */
export type PlaceOrderRequestConfig = {
  data?: never
  pathParams?: never
  queryParams?: never
  headerParams?: never
  /**
   * @type string
   */
  url: '/store/order'
}

/**
 * @type object
 */
export type PlaceOrderResponses = {
  '200': PlaceOrderStatus200
  '405': PlaceOrderStatus405
}

/**
 * @description Union of all possible responses
 */
export type PlaceOrderResponse = PlaceOrderStatus200 | PlaceOrderStatus405
