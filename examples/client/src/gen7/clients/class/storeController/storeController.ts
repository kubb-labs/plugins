/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'
import fetch, { mergeConfig } from '@kubb/plugin-client/clients/fetch'
import type { DeleteOrderPathOrderId, DeleteOrderResponse, DeleteOrderStatus400, DeleteOrderStatus404 } from '../../../models/ts/storeController/DeleteOrder.ts'
import type { GetInventoryResponse } from '../../../models/ts/storeController/GetInventory.ts'
import type {
  GetOrderByIdPathOrderId,
  GetOrderByIdResponse,
  GetOrderByIdStatus400,
  GetOrderByIdStatus404,
} from '../../../models/ts/storeController/GetOrderById.ts'
import type { PlaceOrderData, PlaceOrderResponse, PlaceOrderStatus405 } from '../../../models/ts/storeController/PlaceOrder.ts'
import type { PlaceOrderPatchData, PlaceOrderPatchResponse, PlaceOrderPatchStatus405 } from '../../../models/ts/storeController/PlaceOrderPatch.ts'

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
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetInventoryResponse, ResponseErrorConfig<Error>, unknown>({ ...requestConfig, method: 'GET', url: '/store/inventory' })
    return res.data
  }

  /**
   * @description Place a new order in the store
   * @summary Place an order for a pet
   * {@link /store/order}
   */
  async placeOrder(data?: PlaceOrderData, config: Partial<RequestConfig<PlaceOrderData>> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = data
    const res = await request<PlaceOrderResponse, ResponseErrorConfig<PlaceOrderStatus405>, PlaceOrderData>({
      ...requestConfig,
      method: 'POST',
      url: '/store/order',
      data: requestData,
    })
    return res.data
  }

  /**
   * @description Place a new order in the store with patch
   * @summary Place an order for a pet with patch
   * {@link /store/order}
   */
  async placeOrderPatch(data?: PlaceOrderPatchData, config: Partial<RequestConfig<PlaceOrderPatchData>> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = data
    const res = await request<PlaceOrderPatchResponse, ResponseErrorConfig<PlaceOrderPatchStatus405>, PlaceOrderPatchData>({
      ...requestConfig,
      method: 'PATCH',
      url: '/store/order',
      data: requestData,
    })
    return res.data
  }

  /**
   * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
   * @summary Find purchase order by ID
   * {@link /store/order/:orderId}
   */
  async getOrderById({ orderId }: { orderId: GetOrderByIdPathOrderId }, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetOrderByIdResponse, ResponseErrorConfig<GetOrderByIdStatus400 | GetOrderByIdStatus404>, unknown>({
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
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<DeleteOrderResponse, ResponseErrorConfig<DeleteOrderStatus400 | DeleteOrderStatus404>, unknown>({
      ...requestConfig,
      method: 'DELETE',
      url: `/store/order/${orderId}`,
    })
    return res.data
  }
}
