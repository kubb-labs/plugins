import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Payment } from '../../../models/ts/Payment'
import { client, withUnwrap, resolveThrowOnError, securitySchemes } from '../../../.kubb/client'
import { createPaymentResponseSchema } from '../../../zod/store/payment/createPaymentSchema'

/**
 * `POST /store/payments`
 * @summary Pay for an order
 */
export function createPayment<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body: Payment
      path?: never
      query?: never
      headers?: never
    },
    ThrowOnError
  >,
): Unwrappable<
  RequestResult<
    {
      '201': Payment
    },
    ThrowOnError
  >
> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<
      {
        '201': Payment
      },
      ThrowOnError
    >({
      method: 'POST',
      url: '/store/payments',
      security: [{ ...securitySchemes.device_auth, scopes: ['write:payments'] }],
      contentType: { request: 'application/json' },
      ...config,
      validator: { response: createPaymentResponseSchema, ...config.validator },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
