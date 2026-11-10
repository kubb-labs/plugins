import type { Payment } from '../../models/ts/Payment'

export function createPayment(
  {
    body,
  }: {
    body: Payment
    path?: never
    query?: never
    headers?: never
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<Payment> {
  return cy
    .request<Payment>({
      method: 'POST',
      url: `/store/payments`,
      body,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<Payment>
}
