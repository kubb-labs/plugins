import type { PlaceOrderOptions, PlaceOrderResponse } from '../../models/ts/store/PlaceOrder.ts'

export function placeOrder({ body }: PlaceOrderOptions, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<PlaceOrderResponse> {
  return cy
    .request<PlaceOrderResponse>({
      method: 'POST',
      url: `/store/order`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
