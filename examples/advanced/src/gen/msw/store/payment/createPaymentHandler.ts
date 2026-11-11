import type { Payment } from '../../../models/ts/Payment'
import type { HttpResponseResolver } from 'msw/http'
import type { DefaultBodyType } from 'msw'
import { http, HttpResponse } from 'msw/http'

export function createPaymentHandlerResponse201(data?: Payment) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function createPaymentHandler(
  data?: Payment | HttpResponseResolver<Record<string, string>, Payment extends DefaultBodyType ? Payment : DefaultBodyType>,
  options?: { baseURL?: string },
) {
  return http.post<Record<string, string>, Payment extends DefaultBodyType ? Payment : DefaultBodyType>(
    `${options?.baseURL ?? ''}/store/payments`,
    function handler(info) {
      if (typeof data === 'function') return data(info)

      return createPaymentHandlerResponse201(data)
    },
  )
}
