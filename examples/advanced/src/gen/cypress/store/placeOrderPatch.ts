import type { Order } from '../../models/ts/Order'

export function placeOrderPatch(
  {
    body,
  }: Pick<
    | {
        body?: Order
        path?: never
        query?: never
        headers?: never
        contentType?:
          | 'application/json'
          | {
              request: 'application/json'
            }
      }
    | {
        body?: Order
        path?: never
        query?: never
        headers?: never
        contentType:
          | 'application/xml'
          | {
              request: 'application/xml'
            }
      }
    | {
        body?: Order
        path?: never
        query?: never
        headers?: never
        contentType:
          | 'application/x-www-form-urlencoded'
          | {
              request: 'application/x-www-form-urlencoded'
            }
      },
    'body'
  > = {},
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
