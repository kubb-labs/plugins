import type { PlaceOrderData, PlaceOrderResponse } from '../../models/ts/store/PlaceOrder.ts'

export function placeOrder({ data }: { data?: PlaceOrderData } = {}, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<PlaceOrderResponse> {
  return cy
    .request<PlaceOrderResponse>({
      method: 'POST',
      url: `/store/order`,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
