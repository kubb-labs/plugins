import type { Order } from '../Order.ts'

/**
 * @type object
 */
export type PlaceOrderPatchStatus200 = Order

/**
 * @type any
 */
export type PlaceOrderPatchStatus405 = any

/**
 * @type object | undefined
 */
export type PlaceOrderPatchJsonData = Order | undefined

/**
 * @type object | undefined
 */
export type PlaceOrderPatchXmlData = Order | undefined

/**
 * @type object | undefined
 */
export type PlaceOrderPatchFormUrlEncodedData = Order | undefined

export type PlaceOrderPatchData = PlaceOrderPatchJsonData | PlaceOrderPatchXmlData | PlaceOrderPatchFormUrlEncodedData

/**
 * @type object
 */
export type PlaceOrderPatchRequestConfig = {
  body: PlaceOrderPatchData
  path?: never
  query?: never
  headers?: never
  /**
   * @type string
   */
  url: '/store/order'
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
