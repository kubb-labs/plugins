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
): Cypress.Chainable<unknown | unknown> {
  return cy
    .request<unknown | unknown>({
      method: 'DELETE',
      url: `/store/order/${path.orderId}`,
      ...options,
    })
    .then((res) => res.body)
}
