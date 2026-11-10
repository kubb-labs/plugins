import type { Payment } from '../../models/ts/Payment'
import { http, HttpResponse } from 'msw/http'

export function listPaymentsHandler(
  data?: Array<Payment> | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.get(`${options?.baseURL ?? ''}/store/payments`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse<string>(JSON.stringify(data ?? [{ id: 1, method: 'card', creditCard: '4111', billingAddress: 'Main St 1' }]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Rate-Limit': '100',
        'X-Next-Page': 'cursor=abc',
      },
    })
  })
}
