import type { Payment } from '../../../models/ts/Payment'
import type { PaymentError } from '../../../models/ts/PaymentError'
import { http, HttpResponse } from 'msw/http'

type ListPaymentsStatus2xx = Array<Payment>

export function listPaymentsHandlerResponse2xx(data?: ListPaymentsStatus2xx) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Rate-Limit': '100',
      'X-Next-Page': 'cursor=abc',
    },
  })
}

export function listPaymentsHandlerResponse4xx(data?: PaymentError) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function listPaymentsHandler(
  data?: ListPaymentsStatus2xx | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.get(`${options?.baseURL ?? ''}/store/payments`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse<string>(JSON.stringify(data === undefined ? [{ id: 1, method: 'card', creditCard: '4111', billingAddress: 'Main St 1' }] : data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Rate-Limit': '100',
        'X-Next-Page': 'cursor=abc',
      },
    })
  })
}
