import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { Payment } from '../../../models/ts/Payment'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createPaymentBatch } from '../../axios/paymentService/createPaymentBatch'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createPaymentBatchMutationKey = () => [{ url: '/store/payments/batch' }] as const

export function createPaymentBatchMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>> = {},
) {
  const mutationKey = createPaymentBatchMutationKey()
  return mutationOptions<
    unknown,
    ResponseErrorConfig<Error>,
    {
      body?: [Payment, ...string[]]
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ body }) => {
      return createPaymentBatch({ ...config, body, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `POST /store/payments/batch`
 * @summary Pay for several orders at once
 */
export function useCreatePaymentBatch<TContext>(
  options: {
    mutation?: UseMutationOptions<
      unknown,
      ResponseErrorConfig<Error>,
      {
        body?: [Payment, ...string[]]
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
  const mutationKey = mutationOptions.mutationKey ?? createPaymentBatchMutationKey()

  const baseOptions = createPaymentBatchMutationOptions(config) as UseMutationOptions<
    unknown,
    ResponseErrorConfig<Error>,
    {
      body?: [Payment, ...string[]]
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >

  return useMutation<
    unknown,
    ResponseErrorConfig<Error>,
    {
      body?: [Payment, ...string[]]
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
    unknown,
    ResponseErrorConfig<Error>,
    {
      body?: [Payment, ...string[]]
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >
}
