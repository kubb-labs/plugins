import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { FindPetsByStatusRequestConfig, FindPetsByStatusStatus200, FindPetsByStatusStatus400 } from '../../../models/ts/pet/FindPetsByStatus.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { findPetsByStatus } from '../../axios/petService/findPetsByStatus.ts'

export const findPetsByStatusQueryKey = ({ path }: Omit<FindPetsByStatusRequestConfig, 'url' | 'headers'>) =>
  [{ url: '/pet/findByStatus/:step_id', params: path }] as const

type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

export function findPetsByStatusQueryOptions({ path }: Omit<FindPetsByStatusRequestConfig, 'url'>, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const queryKey = findPetsByStatusQueryKey({ path })
  return queryOptions<
    { status: 200; data: FindPetsByStatusStatus200; statusText: string } | { status: 400; data: FindPetsByStatusStatus400; statusText: string },
    ResponseErrorConfig<FindPetsByStatusStatus400>,
    { status: 200; data: FindPetsByStatusStatus200; statusText: string } | { status: 400; data: FindPetsByStatusStatus400; statusText: string },
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      return findPetsByStatus({ path }, { ...config, signal: config.signal ?? signal })
    },
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export function useFindPetsByStatus<
  TData = { status: 200; data: FindPetsByStatusStatus200; statusText: string } | { status: 400; data: FindPetsByStatusStatus400; statusText: string },
  TQueryData = { status: 200; data: FindPetsByStatusStatus200; statusText: string } | { status: 400; data: FindPetsByStatusStatus400; statusText: string },
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  { path }: Omit<FindPetsByStatusRequestConfig, 'url'>,
  options: {
    query?: Partial<
      QueryObserverOptions<
        { status: 200; data: FindPetsByStatusStatus200; statusText: string } | { status: 400; data: FindPetsByStatusStatus400; statusText: string },
        ResponseErrorConfig<FindPetsByStatusStatus400>,
        TData,
        TQueryData,
        TQueryKey
      >
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const queryKey = resolvedOptions?.queryKey ?? findPetsByStatusQueryKey({ path })

  const queryResult = useQuery(
    {
      ...findPetsByStatusQueryOptions({ path }, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<FindPetsByStatusStatus400>> & { queryKey: TQueryKey }

  queryResult.queryKey = queryKey as TQueryKey

  return queryResult
}
