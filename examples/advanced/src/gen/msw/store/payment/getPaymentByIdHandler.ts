import type { Payment } from '../../../models/ts/Payment'
import { http, HttpResponse } from 'msw/http'

export function getPaymentByIdHandlerResponse200(data?: Payment) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function getPaymentByIdHandler(
  data?: Payment | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.get(`${options?.baseURL ?? ''}/store/payments/:paymentId`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return getPaymentByIdHandlerResponse200(data)
  })
}
