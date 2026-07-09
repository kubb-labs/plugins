import type { Order } from '../Order'

/**
 * @type object
 */
export type PlaceOrderStatus200 = Order

/**
 * @type unknown
 */
export type PlaceOrderStatus405 = unknown

/**
 * @type object | undefined
 */
export type PlaceOrderBodyJson = Order | undefined

/**
 * @type object | undefined
 */
export type PlaceOrderBodyXml = Order | undefined

/**
 * @type object | undefined
 */
export type PlaceOrderBodyFormUrlEncoded = Order | undefined

export type PlaceOrderBody = PlaceOrderBodyJson | PlaceOrderBodyXml | PlaceOrderBodyFormUrlEncoded

/**
 * @type object
 */
export type PlaceOrderOptions = {
  body: PlaceOrderBody
  path?: never
  query?: never
  headers?: never
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
