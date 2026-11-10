import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { Payment } from '../../../models/ts/Payment'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { getPaymentById } from '../../axios/paymentService/getPaymentById'

export const getPaymentByIdQueryKey = ({
  path,
}: Omit<
  {
    body?: never
    path: {
      paymentId: number
    }
    query?: never
    headers?: never
  },
  'headers'
>) => [{ url: '/store/payments/:paymentId', params: path }] as const

type GetPaymentByIdQueryKey = ReturnType<typeof getPaymentByIdQueryKey>

export function getPaymentByIdQueryOptions(
  {
    path,
  }: {
    body?: never
    path: {
      paymentId: number
    }
    query?: never
    headers?: never
  },
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>> = {},
) {
  const queryKey = getPaymentByIdQueryKey({ path })
  return queryOptions<Payment, ResponseErrorConfig<Error>, Payment, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      return getPaymentById({ ...config, path, signal: config.signal ?? signal, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `GET /store/payments/{paymentId}`
 * @summary Find a payment by ID
 */
export function useGetPaymentById<TData = Payment, TQueryData = Payment, TQueryKey extends QueryKey = GetPaymentByIdQueryKey>(
  {
    path,
  }: {
    path:
      | {
          body?: never
          path: {
            paymentId: number
          }
          query?: never
          headers?: never
        }['path']
      | (() => {
          body?: never
          path: {
            paymentId: number
          }
          query?: never
          headers?: never
        }['path'])
  },
  options: {
    query?: Partial<QueryObserverOptions<Payment, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>>
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const resolvedParams = { path: typeof path === 'function' ? path() : path }
  const queryKey = resolvedOptions?.queryKey ?? getPaymentByIdQueryKey(resolvedParams)

  const queryResult = useQuery(
    {
      ...getPaymentByIdQueryOptions(resolvedParams, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  queryResult.queryKey = queryKey as TQueryKey

  return queryResult
}
