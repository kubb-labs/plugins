import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.ts'
import type { FindPetsByStatusRequestConfig, FindPetsByStatusStatus200, FindPetsByStatusStatus400 } from '../../../models/ts/pet/FindPetsByStatus.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { findPetsByStatus } from '../../axios/petService/findPetsByStatus.ts'

export const findPetsByStatusQueryKey = ({ path }: Omit<FindPetsByStatusRequestConfig, 'headers'>) =>
  [{ url: '/pet/findByStatus/:step_id', params: path }] as const

type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

export function findPetsByStatusQueryOptions(
  { path }: FindPetsByStatusRequestConfig,
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookie' | 'url'>> = {},
) {
  const queryKey = findPetsByStatusQueryKey({ path })
  return queryOptions<FindPetsByStatusStatus200, ResponseErrorConfig<FindPetsByStatusStatus400>, FindPetsByStatusStatus200, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      const { data } = await findPetsByStatus({ ...config, path, signal: config.signal ?? signal, throwOnError: true })
      return data
    },
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export function useFindPetsByStatus<
  TData = FindPetsByStatusStatus200,
  TQueryData = FindPetsByStatusStatus200,
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  { path }: FindPetsByStatusRequestConfig,
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByStatusStatus200, ResponseErrorConfig<FindPetsByStatusStatus400>, TData, TQueryData, TQueryKey>> & {
      client?: QueryClient
    }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookie' | 'url'>>
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
