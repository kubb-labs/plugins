import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.ts'
import type { FindPetsByStatusOptions, FindPetsByStatusStatus200, FindPetsByStatusStatus400 } from '../../../models/ts/pet/FindPetsByStatus.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { findPetsByStatus } from '../../axios/petService/findPetsByStatus.ts'

export const findPetsByStatusQueryKey = ({ path }: Omit<FindPetsByStatusOptions, 'headers'>) => [{ url: '/pet/findByStatus/:step_id', params: path }] as const

type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

export function findPetsByStatusQueryOptions(
  { path }: FindPetsByStatusOptions,
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> = {},
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
  { path }: { path: FindPetsByStatusOptions['path'] | (() => FindPetsByStatusOptions['path']) },
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByStatusStatus200, ResponseErrorConfig<FindPetsByStatusStatus400>, TData, TQueryData, TQueryKey>> & {
      client?: QueryClient
    }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const resolvedParams = { path: typeof path === 'function' ? path() : path }
  const queryKey = resolvedOptions?.queryKey ?? findPetsByStatusQueryKey(resolvedParams)

  const queryResult = useQuery(
    {
      ...findPetsByStatusQueryOptions(resolvedParams, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<FindPetsByStatusStatus400>> & { queryKey: TQueryKey }

  queryResult.queryKey = queryKey as TQueryKey

  return queryResult
}
