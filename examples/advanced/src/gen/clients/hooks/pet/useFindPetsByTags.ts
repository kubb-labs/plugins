import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { FindPetsByTagsXEXAMPLEEnumKey } from '../../../models/ts/FindPetsByTagsXEXAMPLEEnum'
import type { Pet } from '../../../models/ts/Pet'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { withQueryKey } from '../../../.kubb/withQueryKey'
import { findPetsByTags } from '../../axios/petService/findPetsByTags'

type FindPetsByTagsOptions = {
  body?: never
  path?: never
  query?: {
    tags?: Array<string>
    page?: string
    pageSize?: number
  }
  headers: {
    'X-EXAMPLE': FindPetsByTagsXEXAMPLEEnumKey
  }
}

type FindPetsByTagsStatus200 = Array<Pet> | string

export const findPetsByTagsQueryKey = ({ query, headers }: Omit<FindPetsByTagsOptions, 'headers'> & { headers?: FindPetsByTagsOptions['headers'] } = {}) =>
  [{ url: '/pet/findByTags' }, ...(query ? [query] : [])] as const

type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>

export function findPetsByTagsQueryOptions(
  { query, headers }: FindPetsByTagsOptions,
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>> = {},
) {
  const queryKey = findPetsByTagsQueryKey({ query, headers })
  return queryOptions<FindPetsByTagsStatus200, ResponseErrorConfig<unknown>, FindPetsByTagsStatus200, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      return findPetsByTags({ ...config, query, headers, signal: config.signal ?? signal, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `GET /pet/findByTags`
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 */
export function useFindPetsByTags<TData = FindPetsByTagsStatus200, TQueryData = FindPetsByTagsStatus200, TQueryKey extends QueryKey = FindPetsByTagsQueryKey>(
  {
    headers,
    query,
  }: {
    headers: FindPetsByTagsOptions['headers'] | (() => FindPetsByTagsOptions['headers'])
    query?: FindPetsByTagsOptions['query'] | (() => FindPetsByTagsOptions['query'])
  },
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByTagsStatus200, ResponseErrorConfig<unknown>, TData, TQueryData, TQueryKey>> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>>
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const resolvedParams = { query: typeof query === 'function' ? query() : query, headers: typeof headers === 'function' ? headers() : headers }
  const queryKey = resolvedOptions?.queryKey ?? findPetsByTagsQueryKey(resolvedParams)

  const queryResult = useQuery(
    {
      ...findPetsByTagsQueryOptions(resolvedParams, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<unknown>> & { queryKey: TQueryKey }

  return withQueryKey(queryResult, queryKey as TQueryKey)
}
