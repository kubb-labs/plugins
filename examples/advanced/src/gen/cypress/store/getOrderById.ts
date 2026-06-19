import type { GetOrderByIdRequestConfig, GetOrderByIdResponse } from '../../models/ts/store/GetOrderById.ts'

export function getOrderById(
  { path }: Omit<GetOrderByIdRequestConfig, 'url'>,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<GetOrderByIdResponse> {
  const { orderId } = path

  return cy
    .request<GetOrderByIdResponse>({
      method: 'GET',
      url: `/store/order/${orderId}`,
      ...options,
    })
    .then((res) => res.body)
}
