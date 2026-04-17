import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { InfiniteData, QueryKey, QueryClient, InfiniteQueryObserverOptions, UseInfiniteQueryResult } from '../../../../tanstack-query-hook'
import type {
  FindPetsByTagsResponse,
  FindPetsByTagsQueryTags,
  FindPetsByTagsQueryPage,
  FindPetsByTagsQueryPageSize,
  FindPetsByTagsHeaderXEXAMPLE,
  FindPetsByTagsStatus400,
} from '../../../models/ts/petController/FindPetsByTags.ts'
import { infiniteQueryOptions, useInfiniteQuery } from '../../../../tanstack-query-hook'
import { findPetsByTags } from '../../axios/petService/findPetsByTags.ts'

export const findPetsByTagsInfiniteQueryKey = (params?: {
  tags?: FindPetsByTagsQueryTags
  page?: FindPetsByTagsQueryPage
  pageSize?: FindPetsByTagsQueryPageSize
}) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>

export function findPetsByTagsInfiniteQueryOptions(
  {
    headers,
    params,
  }: {
    headers: { xEXAMPLE: FindPetsByTagsHeaderXEXAMPLE }
    params?: { tags?: FindPetsByTagsQueryTags; page?: FindPetsByTagsQueryPage; pageSize?: FindPetsByTagsQueryPageSize }
  },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const queryKey = findPetsByTagsInfiniteQueryKey(params)
  return infiniteQueryOptions<
    ResponseConfig<FindPetsByTagsResponse>,
    ResponseErrorConfig<FindPetsByTagsStatus400>,
    InfiniteData<ResponseConfig<FindPetsByTagsResponse>>,
    typeof queryKey,
    number
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      return findPetsByTags({ headers, params }, { ...config, signal: config.signal ?? signal })
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
  TQueryFnData = ResponseConfig<FindPetsByTagsResponse>,
  TError = ResponseErrorConfig<FindPetsByTagsStatus400>,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
  TPageParam = number,
>(
  {
    headers,
    params,
  }: {
    headers: { xEXAMPLE: FindPetsByTagsHeaderXEXAMPLE }
    params?: { tags?: FindPetsByTagsQueryTags; page?: FindPetsByTagsQueryPage; pageSize?: FindPetsByTagsQueryPageSize }
  },
  options: {
    query?: Partial<InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>> & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const queryKey = resolvedOptions?.queryKey ?? findPetsByTagsInfiniteQueryKey(params)

  const query = useInfiniteQuery(
    {
      ...findPetsByTagsInfiniteQueryOptions({ headers, params }, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
    queryClient,
  ) as UseInfiniteQueryResult<TData, TError> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
