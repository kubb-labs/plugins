import type { Payment } from '../../models/ts/Payment'

export function listPayments(
  {
    query,
    cookies,
  }: {
    body?: never
    path?: never
    query?: {
      status?: string
      filter?: string
    }
    headers?: never
    cookies?: {
      session?: string
    }
  } = {},
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<Array<Payment>> {
  const cookie = (Object.entries(cookies ?? {}) as Array<[string, unknown]>)
    .filter(([, value]) => value != null)
    .map(
      ([name, value]) =>
        `${name}=${(['session'].includes(name) ? String : encodeURIComponent)(value instanceof Date ? value.toISOString() : Array.isArray(value) ? value.join(',') : typeof value === 'object' ? JSON.stringify(value) : String(value))}`,
    )
    .join('; ')
  return cy
    .request<Array<Payment>>({
      method: 'GET',
      url: `/store/payments`,
      qs: query,
      headers: { ...(cookie ? { Cookie: cookie } : {}) },
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<Array<Payment>>
}
