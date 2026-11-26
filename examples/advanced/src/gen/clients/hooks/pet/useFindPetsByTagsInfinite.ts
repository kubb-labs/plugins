import type { InfiniteData, QueryKey, QueryClient, InfiniteQueryObserverOptions, UseInfiniteQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { FindPetsByTagsXEXAMPLEEnumKey } from '../../../models/ts/FindPetsByTagsXEXAMPLEEnum'
import type { Pet } from '../../../models/ts/Pet'
import { infiniteQueryOptions, useInfiniteQuery } from '../../../../tanstack-query-hook'
import { withQueryKey } from '../../../.kubb/withQueryKey'
import { findPetsByTags } from '../../axios/petService/findPetsByTags'

type FindPetsByTagsQuery = {
  tags?: Array<string>
  page?: string
  pageSize?: number
}

type FindPetsByTagsOptions = {
  body?: never
  path?: never
  query?: FindPetsByTagsQuery
  headers: {
    'X-EXAMPLE': FindPetsByTagsXEXAMPLEEnumKey
  }
}

type FindPetsByTagsStatus200 = Array<Pet> | string

export const findPetsByTagsInfiniteQueryKey = ({
  query,
  headers,
}: Omit<FindPetsByTagsOptions, 'headers'> & { headers?: FindPetsByTagsOptions['headers'] } = {}) =>
  [{ url: '/pet/findByTags', infinite: true }, ...(query ? [query] : [])] as const

type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>

export function findPetsByTagsInfiniteQueryOptions(
  { query, headers }: FindPetsByTagsOptions,
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>> = {},
) {
  const queryKey = findPetsByTagsInfiniteQueryKey({ query, headers })
  return infiniteQueryOptions<
    FindPetsByTagsStatus200,
    ResponseErrorConfig<unknown>,
    InfiniteData<FindPetsByTagsStatus200>,
    typeof queryKey,
    NonNullable<FindPetsByTagsQuery['pageSize']>
  >({
    queryKey,
    queryFn: async ({ signal, pageParam }) => {
      return findPetsByTags({ ...config, query: { ...query, pageSize: pageParam }, headers, signal: config.signal ?? signal, throwOnError: true }).unwrap()
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1),
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => (firstPageParam <= 1 ? undefined : firstPageParam - 1),
  })
}

/**
 * `GET /pet/findByTags`
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 */
export function useFindPetsByTagsInfinite<
  TQueryFnData = FindPetsByTagsStatus200,
  TError = ResponseErrorConfig<unknown>,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
  TPageParam = NonNullable<FindPetsByTagsQuery['pageSize']>,
>(
  {
    headers,
    query,
  }: {
    headers: FindPetsByTagsOptions['headers'] | (() => FindPetsByTagsOptions['headers'])
    query?: FindPetsByTagsOptions['query'] | (() => FindPetsByTagsOptions['query'])
  },
  options: {
    query?: Partial<InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>>
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const resolvedParams = { query: typeof query === 'function' ? query() : query, headers: typeof headers === 'function' ? headers() : headers }
  const queryKey = resolvedOptions?.queryKey ?? findPetsByTagsInfiniteQueryKey(resolvedParams)

  const queryResult = useInfiniteQuery(
    {
      ...findPetsByTagsInfiniteQueryOptions(resolvedParams, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
    queryClient,
  ) as UseInfiniteQueryResult<TData, TError> & { queryKey: TQueryKey }

  return withQueryKey(queryResult, queryKey as TQueryKey)
}
