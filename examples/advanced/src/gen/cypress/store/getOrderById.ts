import type { Order } from '../../models/ts/Order'

type GetOrderByIdStatus200 = Order | string

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
): Cypress.Chainable<GetOrderByIdStatus200> {
  return cy
    .request<GetOrderByIdStatus200>({
      method: 'GET',
      url: `/store/order/${path.orderId}`,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<GetOrderByIdStatus200>
}
