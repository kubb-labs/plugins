import type { Payment } from '../../../models/ts/Payment'

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
  const rawCookie = (value: string) => {
    if (!/^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]*$/.test(value))
      throw new TypeError('A cookie has characters the cookie style cannot send, escape it first.')
    return value
  }
  const cookie = (Object.entries(cookies ?? {}) as Array<[string, unknown]>)
    .filter(([, value]) => value != null)
    .map(
      ([name, value]) =>
        `${name}=${(['session'].includes(name) ? rawCookie : encodeURIComponent)(value instanceof Date ? value.toISOString() : Array.isArray(value) ? value.join(',') : typeof value === 'object' ? JSON.stringify(value) : String(value))}`,
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
