import type { DeleteOrderOptions, DeleteOrderResponse } from '../../models/ts/store/DeleteOrder.ts'

export function deleteOrder({ path }: DeleteOrderOptions, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<DeleteOrderResponse> {
  return cy
    .request<DeleteOrderResponse>({
      method: 'DELETE',
      url: `/store/order/${path.orderId}`,
      ...options,
    })
    .then((res) => res.body)
}
