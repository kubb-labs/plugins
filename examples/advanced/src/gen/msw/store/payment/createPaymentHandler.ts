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

type MswBody<T> = T extends DefaultBodyType ? T : DefaultBodyType

export function createPaymentHandler(data?: Payment | HttpResponseResolver<Record<string, string>, MswBody<Payment>>, options?: { baseURL?: string }) {
  return http.post<Record<string, string>, MswBody<Payment>>(`${options?.baseURL ?? ''}/store/payments`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return createPaymentHandlerResponse201(data)
  })
}
