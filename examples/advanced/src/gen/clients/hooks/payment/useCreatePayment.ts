import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { Payment } from '../../../models/ts/Payment'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createPayment } from '../../axios/paymentService/createPayment'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createPaymentMutationKey = () => [{ url: '/store/payments' }] as const

export function createPaymentMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>> = {},
) {
  const mutationKey = createPaymentMutationKey()
  return mutationOptions<
    Payment,
    ResponseErrorConfig<Error>,
    {
      body: Payment
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ body }) => {
      return createPayment({ ...config, body, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `POST /store/payments`
 * @summary Pay for an order
 */
export function useCreatePayment<TContext>(
  options: {
    mutation?: UseMutationOptions<
      Payment,
      ResponseErrorConfig<Error>,
      {
        body: Payment
        path?: never
        query?: never
        headers?: never
      },
      TContext
    > & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createPaymentMutationKey()

  const baseOptions = createPaymentMutationOptions(config) as UseMutationOptions<
    Payment,
    ResponseErrorConfig<Error>,
    {
      body: Payment
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >

  return useMutation<
    Payment,
    ResponseErrorConfig<Error>,
    {
      body: Payment
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    Payment,
    ResponseErrorConfig<Error>,
    {
      body: Payment
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >
}
