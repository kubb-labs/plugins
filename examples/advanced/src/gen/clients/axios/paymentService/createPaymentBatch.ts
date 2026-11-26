import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Payment } from '../../../models/ts/Payment'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'
import { createPaymentBatchResponseSchema } from '../../../zod/store/payment/createPaymentBatchSchema'

type CreatePaymentBatchResponses = {
  '204': unknown
}

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
): Unwrappable<RequestResult<CreatePaymentBatchResponses, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap<RequestResult<CreatePaymentBatchResponses, ThrowOnError>>(
    apiClient<CreatePaymentBatchResponses, ThrowOnError>({
      method: 'POST',
      url: '/store/payments/batch',
      contentType: { request: 'multipart/mixed' },
      ...config,
      validator: { response: createPaymentBatchResponseSchema, ...config.validator },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
