import type { OrderEvent } from '../../models/ts/OrderEvent'

export function streamOrderEvents(
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
): Cypress.Chainable<OrderEvent> {
  return cy
    .request<OrderEvent>({
      method: 'GET',
      url: `/store/order/${path.orderId}/events`,
      ...options,
    })
    .then((res) => res.body)
}
