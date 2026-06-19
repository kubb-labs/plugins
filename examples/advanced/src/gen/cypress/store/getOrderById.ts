import type { GetOrderByIdPathOrderId, GetOrderByIdResponse } from '../../models/ts/store/GetOrderById.ts'

export function getOrderById(
  { orderId }: { orderId: GetOrderByIdPathOrderId },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<GetOrderByIdResponse> {
  return cy
    .request<GetOrderByIdResponse>({
      method: 'GET',
      url: `/store/order/${orderId}`,
      ...options,
    })
    .then((res) => res.body)
}
