import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { FindPetsByTagsRequestConfig, FindPetsByTagsStatus200, FindPetsByTagsStatus400 } from '../../../models/ts/pet/FindPetsByTags.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { findPetsByTags } from '../../axios/petService/findPetsByTags.ts'

export const findPetsByTagsQueryKey = ({ query }: Omit<FindPetsByTagsRequestConfig, 'url'> = {}) =>
  [{ url: '/pet/findByTags' }, ...(query ? [query] : [])] as const

type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>

export function findPetsByTagsQueryOptions(
  { query, headers }: Omit<FindPetsByTagsRequestConfig, 'url'> = {},
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const queryKey = findPetsByTagsQueryKey({ query })
  return queryOptions<
    { status: 200; data: FindPetsByTagsStatus200; statusText: string } | { status: 400; data: FindPetsByTagsStatus400; statusText: string },
    ResponseErrorConfig<FindPetsByTagsStatus400>,
    { status: 200; data: FindPetsByTagsStatus200; statusText: string } | { status: 400; data: FindPetsByTagsStatus400; statusText: string },
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      return findPetsByTags({ query, headers }, { ...config, signal: config.signal ?? signal })
    },
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function useFindPetsByTags<
  TData = { status: 200; data: FindPetsByTagsStatus200; statusText: string } | { status: 400; data: FindPetsByTagsStatus400; statusText: string },
  TQueryData = { status: 200; data: FindPetsByTagsStatus200; statusText: string } | { status: 400; data: FindPetsByTagsStatus400; statusText: string },
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(
  { query, headers }: Omit<FindPetsByTagsRequestConfig, 'url'> = {},
  options: {
    query?: Partial<
      QueryObserverOptions<
        { status: 200; data: FindPetsByTagsStatus200; statusText: string } | { status: 400; data: FindPetsByTagsStatus400; statusText: string },
        ResponseErrorConfig<FindPetsByTagsStatus400>,
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
  const queryKey = resolvedOptions?.queryKey ?? findPetsByTagsQueryKey({ query })

  const queryResult = useQuery(
    {
      ...findPetsByTagsQueryOptions({ query, headers }, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<FindPetsByTagsStatus400>> & { queryKey: TQueryKey }

  queryResult.queryKey = queryKey as TQueryKey

  return queryResult
}
