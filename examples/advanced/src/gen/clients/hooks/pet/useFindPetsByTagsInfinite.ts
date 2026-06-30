import type { InfiniteData, QueryKey, QueryClient, InfiniteQueryObserverOptions, UseInfiniteQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.ts'
import type { FindPetsByTagsRequestConfig, FindPetsByTagsStatus200, FindPetsByTagsStatus400 } from '../../../models/ts/pet/FindPetsByTags.ts'
import { infiniteQueryOptions, useInfiniteQuery } from '../../../../tanstack-query-hook'
import { findPetsByTags } from '../../axios/petService/findPetsByTags.ts'

export const findPetsByTagsInfiniteQueryKey = ({ query }: Omit<FindPetsByTagsRequestConfig, 'headers'> = {}) =>
  [{ url: '/pet/findByTags' }, ...(query ? [query] : [])] as const

type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>

export function findPetsByTagsInfiniteQueryOptions(
  { query, headers }: FindPetsByTagsRequestConfig,
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> = {},
) {
  const queryKey = findPetsByTagsInfiniteQueryKey({ query })
  return infiniteQueryOptions<
    FindPetsByTagsStatus200,
    ResponseErrorConfig<FindPetsByTagsStatus400>,
    InfiniteData<FindPetsByTagsStatus200>,
    typeof queryKey,
    number
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      const { data } = await findPetsByTags({ ...config, query, headers, signal: config.signal ?? signal, throwOnError: true })
      return data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1),
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => (firstPageParam <= 1 ? undefined : firstPageParam - 1),
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function useFindPetsByTagsInfinite<
  TQueryFnData = FindPetsByTagsStatus200,
  TError = ResponseErrorConfig<FindPetsByTagsStatus400>,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
  TPageParam = number,
>(
  {
    headers,
    query,
  }: {
    headers: FindPetsByTagsRequestConfig['headers'] | (() => FindPetsByTagsRequestConfig['headers'])
    query?: FindPetsByTagsRequestConfig['query'] | (() => FindPetsByTagsRequestConfig['query'])
  },
  options: {
    query?: Partial<InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>
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

  queryResult.queryKey = queryKey as TQueryKey

  return queryResult
}
