import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { withQueryKey } from '../../../.kubb/withQueryKey'
import { findPetsByStatus } from '../../axios/petService/findPetsByStatus'

type FindPetsByStatusOptions = {
  body?: never
  path: {
    step_id: string
  }
  query?: never
  headers?: never
}

type FindPetsByStatusStatus200 = Array<Pet> | string

export const findPetsByStatusQueryKey = ({ path }: Omit<FindPetsByStatusOptions, 'headers'>) => [{ url: '/pet/findByStatus/:step_id', params: path }] as const

type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

export function findPetsByStatusQueryOptions(
  { path }: FindPetsByStatusOptions,
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>> = {},
) {
  const queryKey = findPetsByStatusQueryKey({ path })
  return queryOptions<FindPetsByStatusStatus200, ResponseErrorConfig<unknown>, FindPetsByStatusStatus200, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      return findPetsByStatus({ ...config, path, signal: config.signal ?? signal, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `GET /pet/findByStatus/{step_id}`
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 */
export function useFindPetsByStatus<
  TData = FindPetsByStatusStatus200,
  TQueryData = FindPetsByStatusStatus200,
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  { path }: { path: FindPetsByStatusOptions['path'] | (() => FindPetsByStatusOptions['path']) },
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByStatusStatus200, ResponseErrorConfig<unknown>, TData, TQueryData, TQueryKey>> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>>
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
  ) as UseQueryResult<TData, ResponseErrorConfig<unknown>> & { queryKey: TQueryKey }

  return withQueryKey(queryResult, queryKey as TQueryKey)
}
