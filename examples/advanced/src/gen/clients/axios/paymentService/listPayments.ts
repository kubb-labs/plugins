import type { Options, Unwrappable, RequestResultWithHeaders } from '../../../.kubb/client'
import type { Payment } from '../../../models/ts/Payment'
import type { PaymentError } from '../../../models/ts/PaymentError'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'
import { listPaymentsResponseSchema, listPaymentsStatus4xxSchema } from '../../../zod/store/payment/listPaymentsSchema'

type ListPaymentsResponses = {
  '2xx': Array<Payment>
  '4xx': PaymentError
}

type ListPaymentsResponseHeaders = {
  '2xx': {
    'X-Rate-Limit': number
    'X-Next-Page'?: string
  }
}

/**
 * `GET /store/payments`
 * @summary List payments
 * @see http://swagger.io Payment guide
 */
export function listPayments<ThrowOnError extends boolean = true>(
  options: Options<
    {
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
    },
    ThrowOnError
  > = {},
): Unwrappable<RequestResultWithHeaders<ListPaymentsResponses, ListPaymentsResponseHeaders, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap<RequestResultWithHeaders<ListPaymentsResponses, ListPaymentsResponseHeaders, ThrowOnError>>(
    apiClient<ListPaymentsResponses, ThrowOnError, ListPaymentsResponseHeaders>({
      method: 'GET',
      url: '/store/payments',
      ...config,
      styles: { ...config.styles, cookie: { session: { style: 'cookie' }, ...config.styles?.cookie } },
      validator: { response: listPaymentsResponseSchema, error: { '4xx': listPaymentsStatus4xxSchema }, ...config.validator },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
