import type { PlaceOrderResponse } from '../../models/ts/storeController/PlaceOrder.ts'

export function placeOrder(data?: PlaceOrderData, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<PlaceOrderResponse> {
  return cy
    .request<PlaceOrderResponse>({
      method: 'POST',
      url: `/store/order`,
      ...options,
    })
    .then((res) => res.body)
}
