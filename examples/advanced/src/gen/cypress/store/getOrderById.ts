import type { GetOrderByIdRequestConfig, GetOrderByIdResponse } from '../../models/ts/store/GetOrderById.ts'

export function getOrderById({ path }: GetOrderByIdRequestConfig, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<GetOrderByIdResponse> {
  return cy
    .request<GetOrderByIdResponse>({
      method: 'GET',
      url: `/store/order/${path.orderId}`,
      ...options,
    })
    .then((res) => res.body)
}
