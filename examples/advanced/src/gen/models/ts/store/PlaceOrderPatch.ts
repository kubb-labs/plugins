import type { Order } from '../Order.ts'

/**
 * @type object
 */
export type PlaceOrderPatchStatus200 = Order

/**
 * @type unknown
 */
export type PlaceOrderPatchStatus405 = unknown

/**
 * @type object | undefined
 */
export type PlaceOrderPatchBodyJson = Order | undefined

/**
 * @type object | undefined
 */
export type PlaceOrderPatchBodyXml = Order | undefined

/**
 * @type object | undefined
 */
export type PlaceOrderPatchBodyFormUrlEncoded = Order | undefined

export type PlaceOrderPatchBody = PlaceOrderPatchBodyJson | PlaceOrderPatchBodyXml | PlaceOrderPatchBodyFormUrlEncoded

/**
 * @type object
 */
export type PlaceOrderPatchRequestConfig = {
  body: PlaceOrderPatchBody
  path?: never
  query?: never
  headers?: never
}

/**
 * @type object
 */
export type PlaceOrderPatchResponses = {
  '200': PlaceOrderPatchStatus200
  '405': PlaceOrderPatchStatus405
}

/**
 * @description Union of all possible responses
 */
export type PlaceOrderPatchResponse = PlaceOrderPatchStatus200 | PlaceOrderPatchStatus405
