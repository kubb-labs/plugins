// version: 1.0.11

/**
 * @type object
 */
export type GetInventoryStatus200 = {
  [key: string]: number
}

/**
 * @type object
 */
export type GetInventoryRequestConfig = {
  body?: never
  path?: never
  query?: never
  headers?: never
  /**
   * @type string
   */
  url: '/store/inventory'
}

/**
 * @type object
 */
export type GetInventoryResponses = {
  '200': GetInventoryStatus200
}

/**
 * @description Union of all possible responses
 */
export type GetInventoryResponse = GetInventoryStatus200
