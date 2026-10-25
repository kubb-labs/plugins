import type { Order } from '../../models/ts/Order'

export function placeOrder(
  {
    body,
  }: Pick<
    | {
        body: Order
        path?: never
        query?: never
        headers?: never
        contentType?: {
          request: 'application/json'
        }
      }
    | {
        body: Order
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/xml'
        }
      }
    | {
        body: Order
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/x-www-form-urlencoded'
        }
      },
    'body'
  >,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<Order> {
  return cy
    .request<Order>({
      method: 'POST',
      url: `/store/order`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
