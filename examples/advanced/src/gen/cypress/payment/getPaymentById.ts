import type { Payment } from '../../models/ts/Payment'

export function getPaymentById(
  {
    path,
  }: {
    body?: never
    path: {
      paymentId: number
    }
    query?: never
    headers?: never
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<Payment> {
  return cy
    .request<Payment>({
      method: 'GET',
      url: `/store/payments/${path.paymentId}`,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<Payment>
}
