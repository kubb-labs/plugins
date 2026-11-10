import type { Payment } from '../../../models/ts/Payment'

export function createPaymentBatch(
  {
    body,
  }: {
    body?: [Payment, ...string[]]
    path?: never
    query?: never
    headers?: never
  } = {},
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<unknown> {
  return cy
    .request<unknown>({
      method: 'POST',
      url: `/store/payments/batch`,
      body,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<unknown>
}
