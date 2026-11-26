import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { Payment } from '../../../models/ts/Payment'
import type { PaymentError } from '../../../models/ts/PaymentError'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { withQueryKey } from '../../../.kubb/withQueryKey'
import { listPayments } from '../../axios/paymentService/listPayments'

type ListPaymentsOptions = {
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
}

type ListPaymentsStatus2xx = Array<Payment>

export const listPaymentsQueryKey = ({ query }: Omit<ListPaymentsOptions, 'headers' | 'cookies'> = {}) =>
  [{ url: '/store/payments' }, ...(query ? [query] : [])] as const

type ListPaymentsQueryKey = ReturnType<typeof listPaymentsQueryKey>

export function listPaymentsQueryOptions(
  { query, cookies }: ListPaymentsOptions = {},
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>> = {},
) {
  const queryKey = listPaymentsQueryKey({ query })
  return queryOptions<ListPaymentsStatus2xx, ResponseErrorConfig<PaymentError>, ListPaymentsStatus2xx, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      return listPayments({ ...config, query, cookies, signal: config.signal ?? signal, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `GET /store/payments`
 * @summary List payments
 * @see http://swagger.io Payment guide
 */
export function useListPayments<TData = ListPaymentsStatus2xx, TQueryData = ListPaymentsStatus2xx, TQueryKey extends QueryKey = ListPaymentsQueryKey>(
  {
    query,
    cookies,
  }: {
    query?: ListPaymentsOptions['query'] | (() => ListPaymentsOptions['query'])
    cookies?: ListPaymentsOptions['cookies'] | (() => ListPaymentsOptions['cookies'])
  } = {},
  options: {
    query?: Partial<QueryObserverOptions<ListPaymentsStatus2xx, ResponseErrorConfig<PaymentError>, TData, TQueryData, TQueryKey>> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>>
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const resolvedParams = { query: typeof query === 'function' ? query() : query, cookies: typeof cookies === 'function' ? cookies() : cookies }
  const queryKey = resolvedOptions?.queryKey ?? listPaymentsQueryKey(resolvedParams)

  const queryResult = useQuery(
    {
      ...listPaymentsQueryOptions(resolvedParams, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<PaymentError>> & { queryKey: TQueryKey }

  return withQueryKey(queryResult, queryKey as TQueryKey)
}
