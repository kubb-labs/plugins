import type { Order } from '../../models/ts/Order'

export function getOrderById(
  {
    path,
  }: {
    body?: never
    path: {
      orderId: number
    }
    query?: never
    headers?: never
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<Order> {
  return cy
    .request<Order>({
      method: 'GET',
      url: `/store/order/${path.orderId}`,
      ...options,
    })
    .then((res) => res.body)
}
