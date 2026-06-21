/* eslint-disable no-alert, no-console */

import type { ClientInstance, Options, RequestConfig, RequestResult } from '../../../.kubb/client.ts'
import type { DeleteOrderRequestConfig, DeleteOrderResponses } from '../../../models/ts/store/DeleteOrder.ts'
import type { GetInventoryRequestConfig, GetInventoryResponses } from '../../../models/ts/store/GetInventory.ts'
import type { GetOrderByIdRequestConfig, GetOrderByIdResponses } from '../../../models/ts/store/GetOrderById.ts'
import type { PlaceOrderRequestConfig, PlaceOrderResponses } from '../../../models/ts/store/PlaceOrder.ts'
import type { PlaceOrderPatchRequestConfig, PlaceOrderPatchResponses } from '../../../models/ts/store/PlaceOrderPatch.ts'
import { client } from '../../../.kubb/client.ts'

export class store {
  #config: Partial<RequestConfig> & { client?: ClientInstance }

  constructor(config: Partial<RequestConfig> & { client?: ClientInstance } = {}) {
    this.#config = config
  }

  /**
   * @description Returns a map of status codes to quantities
   * @summary Returns pet inventories by status
   * {@link /store/inventory}
   */
  async getInventory<ThrowOnError extends boolean = true>(
    options: Options<GetInventoryRequestConfig, ThrowOnError>,
  ): Promise<RequestResult<GetInventoryResponses, ThrowOnError>> {
    const { client: request = client, ...config } = { ...this.#config, ...options }
    return request({ method: 'GET', url: '/store/inventory', ...config }) as Promise<RequestResult<GetInventoryResponses, ThrowOnError>>
  }

  /**
   * @description Place a new order in the store
   * @summary Place an order for a pet
   * {@link /store/order}
   */
  async placeOrder<ThrowOnError extends boolean = true>(
    options: Options<PlaceOrderRequestConfig, ThrowOnError>,
  ): Promise<RequestResult<PlaceOrderResponses, ThrowOnError>> {
    const { client: request = client, ...config } = { ...this.#config, ...options }
    return request({ method: 'POST', url: '/store/order', ...config }) as Promise<RequestResult<PlaceOrderResponses, ThrowOnError>>
  }

  /**
   * @description Place a new order in the store with patch
   * @summary Place an order for a pet with patch
   * {@link /store/order}
   */
  async placeOrderPatch<ThrowOnError extends boolean = true>(
    options: Options<PlaceOrderPatchRequestConfig, ThrowOnError>,
  ): Promise<RequestResult<PlaceOrderPatchResponses, ThrowOnError>> {
    const { client: request = client, ...config } = { ...this.#config, ...options }
    return request({ method: 'PATCH', url: '/store/order', ...config }) as Promise<RequestResult<PlaceOrderPatchResponses, ThrowOnError>>
  }

  /**
   * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
   * @summary Find purchase order by ID
   * {@link /store/order/:orderId}
   */
  async getOrderById<ThrowOnError extends boolean = true>(
    options: Options<GetOrderByIdRequestConfig, ThrowOnError>,
  ): Promise<RequestResult<GetOrderByIdResponses, ThrowOnError>> {
    const { client: request = client, ...config } = { ...this.#config, ...options }
    return request({ method: 'GET', url: '/store/order/{orderId}', ...config }) as Promise<RequestResult<GetOrderByIdResponses, ThrowOnError>>
  }

  /**
   * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
   * @summary Delete purchase order by ID
   * {@link /store/order/:orderId}
   */
  async deleteOrder<ThrowOnError extends boolean = true>(
    options: Options<DeleteOrderRequestConfig, ThrowOnError>,
  ): Promise<RequestResult<DeleteOrderResponses, ThrowOnError>> {
    const { client: request = client, ...config } = { ...this.#config, ...options }
    return request({ method: 'DELETE', url: '/store/order/{orderId}', ...config }) as Promise<RequestResult<DeleteOrderResponses, ThrowOnError>>
  }
}
