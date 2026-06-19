/* eslint-disable no-alert, no-console */

import client from '@kubb/plugin-client/clients/fetch'
import type { DeleteOrderRequestConfig, DeleteOrderResponse, DeleteOrderStatus400, DeleteOrderStatus404 } from '../../../models/ts/store/DeleteOrder.ts'
import type { GetInventoryStatus200 } from '../../../models/ts/store/GetInventory.ts'
import type { GetOrderByIdRequestConfig, GetOrderByIdStatus200, GetOrderByIdStatus400, GetOrderByIdStatus404 } from '../../../models/ts/store/GetOrderById.ts'
import type { PlaceOrderRequestConfig, PlaceOrderData, PlaceOrderStatus200, PlaceOrderStatus405 } from '../../../models/ts/store/PlaceOrder.ts'
import type {
  PlaceOrderPatchRequestConfig,
  PlaceOrderPatchData,
  PlaceOrderPatchStatus200,
  PlaceOrderPatchStatus405,
} from '../../../models/ts/store/PlaceOrderPatch.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'
import { mergeConfig } from '@kubb/plugin-client/clients/fetch'

export class store {
  #config: Partial<RequestConfig> & { client?: Client }

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
    this.#config = config
  }

  /**
   * @description Returns a map of status codes to quantities
   * @summary Returns pet inventories by status
   * {@link /store/inventory}
   */
  async getInventory(config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = client, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetInventoryStatus200, ResponseErrorConfig<Error>, unknown>({ ...requestConfig, method: 'GET', url: `/store/inventory` })
    return res.data
  }

  /**
   * @description Place a new order in the store
   * @summary Place an order for a pet
   * {@link /store/order}
   */
  async placeOrder(
    { body }: Omit<PlaceOrderRequestConfig, 'url'>,
    config: Partial<RequestConfig<PlaceOrderData>> & {
      client?: Client
      contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
    } = {},
  ) {
    const { client: request = client, contentType = 'application/json', ...requestConfig } = mergeConfig(this.#config, config)
    const requestBody = body
    const res = await request<PlaceOrderStatus200, ResponseErrorConfig<PlaceOrderStatus405>, PlaceOrderData>({
      ...requestConfig,
      method: 'POST',
      url: `/store/order`,
      body: requestBody,
      contentType,
    })
    return res.data
  }

  /**
   * @description Place a new order in the store with patch
   * @summary Place an order for a pet with patch
   * {@link /store/order}
   */
  async placeOrderPatch(
    { body }: Omit<PlaceOrderPatchRequestConfig, 'url'>,
    config: Partial<RequestConfig<PlaceOrderPatchData>> & {
      client?: Client
      contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
    } = {},
  ) {
    const { client: request = client, contentType = 'application/json', ...requestConfig } = mergeConfig(this.#config, config)
    const requestBody = body
    const res = await request<PlaceOrderPatchStatus200, ResponseErrorConfig<PlaceOrderPatchStatus405>, PlaceOrderPatchData>({
      ...requestConfig,
      method: 'PATCH',
      url: `/store/order`,
      body: requestBody,
      contentType,
    })
    return res.data
  }

  /**
   * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
   * @summary Find purchase order by ID
   * {@link /store/order/:orderId}
   */
  async getOrderById({ path }: Omit<GetOrderByIdRequestConfig, 'url'>, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = client, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetOrderByIdStatus200, ResponseErrorConfig<GetOrderByIdStatus400 | GetOrderByIdStatus404>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/store/order/${path.orderId}`,
    })
    return res.data
  }

  /**
   * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
   * @summary Delete purchase order by ID
   * {@link /store/order/:orderId}
   */
  async deleteOrder({ path }: Omit<DeleteOrderRequestConfig, 'url'>, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = client, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<DeleteOrderResponse, ResponseErrorConfig<DeleteOrderStatus400 | DeleteOrderStatus404>, unknown>({
      ...requestConfig,
      method: 'DELETE',
      url: `/store/order/${path.orderId}`,
    })
    return res.data
  }
}
