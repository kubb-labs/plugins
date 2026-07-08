import type { Order } from '../Order.ts'

/**
 * @type object
 */
export type GetOrderByIdPath = {
  /**
   * @description ID of order that needs to be fetched
   *
   * Format: `int64`
   * @type integer
   */
  orderId: number
}

/**
 * @type object
 */
export type GetOrderByIdStatus200Json = Order

/**
 * @type object
 */
export type GetOrderByIdStatus200Xml = Order

export type GetOrderByIdStatus200 = GetOrderByIdStatus200Json | GetOrderByIdStatus200Xml

/**
 * @type unknown
 */
export type GetOrderByIdStatus400 = unknown

/**
 * @type unknown
 */
export type GetOrderByIdStatus404 = unknown

/**
 * @type object
 */
export type GetOrderByIdOptions = {
  body?: never
  path: GetOrderByIdPath
  query?: never
  headers?: never
}

/**
 * @type object
 */
export type GetOrderByIdResponses = {
  '200':
    | {
        contentType: 'application/json'
        data: GetOrderByIdStatus200Json
      }
    | {
        contentType: 'application/xml'
        data: GetOrderByIdStatus200Xml
      }
  '400': GetOrderByIdStatus400
  '404': GetOrderByIdStatus404
}

/**
 * @description Union of all possible responses
 */
export type GetOrderByIdResponse = GetOrderByIdStatus200 | GetOrderByIdStatus400 | GetOrderByIdStatus404
