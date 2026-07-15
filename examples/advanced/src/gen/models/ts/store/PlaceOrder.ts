import type { Order } from '../Order'

export type PlaceOrderStatus200 = Order

export type PlaceOrderStatus405 = unknown

export type PlaceOrderBodyJson = Order | undefined

export type PlaceOrderBodyXml = Order | undefined

export type PlaceOrderBodyFormUrlEncoded = Order | undefined

export type PlaceOrderBody = PlaceOrderBodyJson | PlaceOrderBodyXml | PlaceOrderBodyFormUrlEncoded

export type PlaceOrderOptions = {
  body: PlaceOrderBody
  path?: never
  query?: never
  headers?: never
}

export type PlaceOrderResponses = {
  '200': PlaceOrderStatus200
  '405': PlaceOrderStatus405
}

/**
 * @description Union of all possible responses
 */
export type PlaceOrderResponse = PlaceOrderStatus200 | PlaceOrderStatus405
