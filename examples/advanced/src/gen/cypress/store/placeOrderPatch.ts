import type { Order } from '../../models/ts/Order'

export function placeOrderPatch(
  {
    body,
  }: {
    body: Order
    path?: never
    query?: never
    headers?: never
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<Order> {
  return cy
    .request<Order>({
      method: 'PATCH',
      url: `/store/order`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
