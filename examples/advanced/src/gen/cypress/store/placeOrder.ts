import type { PlaceOrderRequestConfig, PlaceOrderResponse } from '../../models/ts/store/PlaceOrder.ts'

export function placeOrder({ body }: PlaceOrderRequestConfig, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<PlaceOrderResponse> {
  return cy
    .request<PlaceOrderResponse>({
      method: 'POST',
      url: `/store/order`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
