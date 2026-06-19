import type { DeleteOrderRequestConfig, DeleteOrderResponse } from '../../models/ts/store/DeleteOrder.ts'

export function deleteOrder(
  { path }: Omit<DeleteOrderRequestConfig, 'url'>,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<DeleteOrderResponse> {
  const { orderId } = path

  return cy
    .request<DeleteOrderResponse>({
      method: 'DELETE',
      url: `/store/order/${orderId}`,
      ...options,
    })
    .then((res) => res.body)
}
