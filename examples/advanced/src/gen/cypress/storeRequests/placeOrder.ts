import type { Order } from '../../models/ts/Order.ts'
import type { PlaceOrderData, PlaceOrderResponse } from '../../models/ts/storeController/PlaceOrder.ts'

export function placeOrder(data?: PlaceOrderData, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<PlaceOrderResponse> {
  return cy
    .request<PlaceOrderResponse>({
      method: 'POST',
      url: `/store/order`,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
