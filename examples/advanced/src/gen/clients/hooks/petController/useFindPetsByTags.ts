import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type {
  FindPetsByTagsResponse,
  FindPetsByTagsQueryTags,
  FindPetsByTagsQueryPage,
  FindPetsByTagsQueryPageSize,
  FindPetsByTagsHeaderXEXAMPLE,
  FindPetsByTagsStatus400,
} from '../../../models/ts/petController/FindPetsByTags.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { findPetsByTags } from '../../axios/petService/findPetsByTags.ts'

export const findPetsByTagsQueryKey = (params?: { tags?: FindPetsByTagsQueryTags; page?: FindPetsByTagsQueryPage; pageSize?: FindPetsByTagsQueryPageSize }) =>
  [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>

export function findPetsByTagsQueryOptions(
  {
    headers,
    params,
  }: {
    headers: { xEXAMPLE: FindPetsByTagsHeaderXEXAMPLE }
    params?: { tags?: FindPetsByTagsQueryTags; page?: FindPetsByTagsQueryPage; pageSize?: FindPetsByTagsQueryPageSize }
  },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const queryKey = findPetsByTagsQueryKey(params)
  return queryOptions<
    ResponseConfig<FindPetsByTagsResponse>,
    ResponseErrorConfig<FindPetsByTagsStatus400>,
    ResponseConfig<FindPetsByTagsResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      return findPetsByTags({ headers, params }, { ...config, signal: config.signal ?? signal })
    },
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function useFindPetsByTags<
  TData = ResponseConfig<FindPetsByTagsResponse>,
  TQueryData = ResponseConfig<FindPetsByTagsResponse>,
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(
  {
    headers,
    params,
  }: {
    headers: { xEXAMPLE: FindPetsByTagsHeaderXEXAMPLE }
    params?: { tags?: FindPetsByTagsQueryTags; page?: FindPetsByTagsQueryPage; pageSize?: FindPetsByTagsQueryPageSize }
  },
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<FindPetsByTagsResponse>, ResponseErrorConfig<FindPetsByTagsStatus400>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const queryKey = resolvedOptions?.queryKey ?? findPetsByTagsQueryKey(params)

  const query = useQuery(
    {
      ...findPetsByTagsQueryOptions({ headers, params }, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<FindPetsByTagsStatus400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
