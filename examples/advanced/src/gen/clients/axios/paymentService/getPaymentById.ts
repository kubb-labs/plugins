import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Payment } from '../../../models/ts/Payment'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'
import { getPaymentByIdResponseSchema } from '../../../zod/store/payment/getPaymentByIdSchema'

type GetPaymentByIdResponses = {
  '200': Payment
}

/**
 * `GET /store/payments/{paymentId}`
 * @summary Find a payment by ID
 */
export function getPaymentById<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body?: never
      path: {
        paymentId: number
      }
      query?: never
      headers?: never
    },
    ThrowOnError
  >,
): Unwrappable<RequestResult<GetPaymentByIdResponses, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap<RequestResult<GetPaymentByIdResponses, ThrowOnError>>(
    apiClient<GetPaymentByIdResponses, ThrowOnError>({
      method: 'GET',
      url: '/store/payments/{paymentId}',
      ...config,
      validator: { response: getPaymentByIdResponseSchema, ...config.validator },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
