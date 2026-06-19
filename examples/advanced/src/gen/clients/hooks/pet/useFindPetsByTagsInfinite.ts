import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { InfiniteData, QueryKey, QueryClient, InfiniteQueryObserverOptions, UseInfiniteQueryResult } from '../../../../tanstack-query-hook'
import type { FindPetsByTagsRequestConfig, FindPetsByTagsStatus200, FindPetsByTagsStatus400 } from '../../../models/ts/pet/FindPetsByTags.ts'
import { infiniteQueryOptions, useInfiniteQuery } from '../../../../tanstack-query-hook'
import { findPetsByTags } from '../../axios/petService/findPetsByTags.ts'

export const findPetsByTagsInfiniteQueryKey = ({ query }: Omit<FindPetsByTagsRequestConfig, 'url' | 'headers'> = {}) =>
  [{ url: '/pet/findByTags' }, ...(query ? [query] : [])] as const

type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>

export function findPetsByTagsInfiniteQueryOptions(
  { query, headers }: Omit<FindPetsByTagsRequestConfig, 'url'>,
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const queryKey = findPetsByTagsInfiniteQueryKey({ query })
  return infiniteQueryOptions<
    { status: 200; data: FindPetsByTagsStatus200; statusText: string } | { status: 400; data: FindPetsByTagsStatus400; statusText: string },
    ResponseErrorConfig<FindPetsByTagsStatus400>,
    InfiniteData<{ status: 200; data: FindPetsByTagsStatus200; statusText: string } | { status: 400; data: FindPetsByTagsStatus400; statusText: string }>,
    typeof queryKey,
    number
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      return findPetsByTags({ query, headers }, { ...config, signal: config.signal ?? signal })
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (Array.isArray(lastPage.data) && lastPage.data.length === 0 ? undefined : lastPageParam + 1),
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => (firstPageParam <= 1 ? undefined : firstPageParam - 1),
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function useFindPetsByTagsInfinite<
  TQueryFnData = { status: 200; data: FindPetsByTagsStatus200; statusText: string } | { status: 400; data: FindPetsByTagsStatus400; statusText: string },
  TError = ResponseErrorConfig<FindPetsByTagsStatus400>,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
  TPageParam = number,
>(
  { query, headers }: Omit<FindPetsByTagsRequestConfig, 'url'>,
  options: {
    query?: Partial<InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>> & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const queryKey = resolvedOptions?.queryKey ?? findPetsByTagsInfiniteQueryKey({ query })

  const queryResult = useInfiniteQuery(
    {
      ...findPetsByTagsInfiniteQueryOptions({ query, headers }, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
    queryClient,
  ) as UseInfiniteQueryResult<TData, TError> & { queryKey: TQueryKey }

  queryResult.queryKey = queryKey as TQueryKey

  return queryResult
}
