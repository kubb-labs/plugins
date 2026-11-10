import type { Options, Unwrappable, RequestResultWithHeaders } from '../../../.kubb/client'
import type { Payment } from '../../../models/ts/Payment'
import type { PaymentError } from '../../../models/ts/PaymentError'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'
import { listPaymentsResponseSchema, listPaymentsStatus4XXSchema } from '../../../zod/payment/listPaymentsSchema'

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
): Unwrappable<
  RequestResultWithHeaders<
    {
      '2XX': Array<Payment>
      '4XX': PaymentError
    },
    {
      '2XX': {
        'X-Rate-Limit': number
        'X-Next-Page'?: string
      }
    },
    ThrowOnError
  >
> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<
      {
        '2XX': Array<Payment>
        '4XX': PaymentError
      },
      ThrowOnError,
      {
        '2XX': {
          'X-Rate-Limit': number
          'X-Next-Page'?: string
        }
      }
    >({
      method: 'GET',
      url: '/store/payments',
      ...config,
      styles: { ...config.styles, cookie: { session: { style: 'cookie' }, ...config.styles?.cookie } },
      validator: { response: listPaymentsResponseSchema, error: { '4XX': listPaymentsStatus4XXSchema }, ...config.validator },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
