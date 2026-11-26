type DeleteOrderResponse = unknown | unknown

export function deleteOrder(
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
): Cypress.Chainable<DeleteOrderResponse> {
  return cy
    .request<DeleteOrderResponse>({
      method: 'DELETE',
      url: `/store/order/${path.orderId}`,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<DeleteOrderResponse>
}
