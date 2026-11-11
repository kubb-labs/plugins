import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Payment } from '../../../models/ts/Payment'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'
import { createPaymentBatchResponseSchema } from '../../../zod/store/payment/createPaymentBatchSchema'

/**
 * `POST /store/payments/batch`
 * @summary Pay for several orders at once
 */
export function createPaymentBatch<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body?: [Payment, ...string[]]
      path?: never
      query?: never
      headers?: never
    },
    ThrowOnError
  > = {},
): Unwrappable<
  RequestResult<
    {
      '204': unknown
    },
    ThrowOnError
  >
> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<
      {
        '204': unknown
      },
      ThrowOnError
    >({
      method: 'POST',
      url: '/store/payments/batch',
      contentType: { request: 'multipart/mixed' },
      ...config,
      validator: { response: createPaymentBatchResponseSchema, ...config.validator },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
