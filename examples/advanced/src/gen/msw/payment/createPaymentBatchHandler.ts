import type { Payment } from '../../models/ts/Payment'
import type { HttpResponseResolver } from 'msw/http'
import type { DefaultBodyType } from 'msw'
import { http, HttpResponse } from 'msw/http'

export function createPaymentBatchHandlerResponse204(data?: unknown) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 204,
  })
}

export function createPaymentBatchHandler(
  data?:
    | string
    | number
    | boolean
    | null
    | object
    | HttpResponseResolver<Record<string, string>, [Payment, ...string[]] extends DefaultBodyType ? [Payment, ...string[]] : DefaultBodyType>,
  options?: { baseURL?: string },
) {
  return http.post<Record<string, string>, [Payment, ...string[]] extends DefaultBodyType ? [Payment, ...string[]] : DefaultBodyType>(
    `${options?.baseURL ?? ''}/store/payments/batch`,
    function handler(info) {
      if (typeof data === 'function') return data(info)

      return new HttpResponse<string>(JSON.stringify(data), {
        status: 204,
      })
    },
  )
}
