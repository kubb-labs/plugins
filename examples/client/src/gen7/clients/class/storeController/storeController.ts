/* eslint-disable no-alert, no-console */

import client from '@kubb/plugin-client/clients/fetch'
import type { Order } from '../../../models/ts/Order.ts'
import type { DeleteOrderResponse, DeleteOrderPathOrderId, DeleteOrderStatus400, DeleteOrderStatus404 } from '../../../models/ts/storeController/DeleteOrder.ts'
import type { GetInventoryStatus200 } from '../../../models/ts/storeController/GetInventory.ts'
import type { GetOrderByIdPathOrderId, GetOrderByIdStatus400, GetOrderByIdStatus404 } from '../../../models/ts/storeController/GetOrderById.ts'
import type { PlaceOrderData, PlaceOrderStatus405 } from '../../../models/ts/storeController/PlaceOrder.ts'
import type { PlaceOrderPatchData, PlaceOrderPatchStatus405 } from '../../../models/ts/storeController/PlaceOrderPatch.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'
import { mergeConfig } from '@kubb/plugin-client/clients/fetch'

export class storeController {
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
    data?: PlaceOrderData,
    config: Partial<RequestConfig<PlaceOrderData>> & {
      client?: Client
      contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
    } = {},
  ) {
    const { client: request = client, contentType = 'application/json', ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = data
    const res = await request<Order, ResponseErrorConfig<PlaceOrderStatus405>, PlaceOrderData>({
      ...requestConfig,
      method: 'POST',
      url: `/store/order`,
      data: requestData,
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
    data?: PlaceOrderPatchData,
    config: Partial<RequestConfig<PlaceOrderPatchData>> & {
      client?: Client
      contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
    } = {},
  ) {
    const { client: request = client, contentType = 'application/json', ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = data
    const res = await request<Order, ResponseErrorConfig<PlaceOrderPatchStatus405>, PlaceOrderPatchData>({
      ...requestConfig,
      method: 'PATCH',
      url: `/store/order`,
      data: requestData,
      contentType,
    })
    return res.data
  }

  /**
   * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
   * @summary Find purchase order by ID
   * {@link /store/order/:orderId}
   */
  async getOrderById({ orderId }: { orderId: GetOrderByIdPathOrderId }, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = client, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<Order, ResponseErrorConfig<GetOrderByIdStatus400 | GetOrderByIdStatus404>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/store/order/${orderId}`,
    })
    return res.data
  }

  /**
   * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
   * @summary Delete purchase order by ID
   * {@link /store/order/:orderId}
   */
  async deleteOrder({ orderId }: { orderId: DeleteOrderPathOrderId }, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = client, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<DeleteOrderResponse, ResponseErrorConfig<DeleteOrderStatus400 | DeleteOrderStatus404>, unknown>({
      ...requestConfig,
      method: 'DELETE',
      url: `/store/order/${orderId}`,
    })
    return res.data
  }
}
