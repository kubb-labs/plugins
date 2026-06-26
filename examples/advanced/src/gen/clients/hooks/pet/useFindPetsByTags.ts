import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.ts'
import type { FindPetsByTagsRequestConfig, FindPetsByTagsStatus200, FindPetsByTagsStatus400 } from '../../../models/ts/pet/FindPetsByTags.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { findPetsByTags } from '../../axios/petService/findPetsByTags.ts'

export const findPetsByTagsQueryKey = ({ query }: Omit<FindPetsByTagsRequestConfig, 'headers'> = {}) =>
  [{ url: '/pet/findByTags' }, ...(query ? [query] : [])] as const

type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>

export function findPetsByTagsQueryOptions(
  { query, headers }: FindPetsByTagsRequestConfig,
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookie' | 'url'>> = {},
) {
  const queryKey = findPetsByTagsQueryKey({ query })
  return queryOptions<FindPetsByTagsStatus200, ResponseErrorConfig<FindPetsByTagsStatus400>, FindPetsByTagsStatus200, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      const { data } = await findPetsByTags({ ...config, query, headers, signal: config.signal ?? signal, throwOnError: true })
      return data
    },
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function useFindPetsByTags<TData = FindPetsByTagsStatus200, TQueryData = FindPetsByTagsStatus200, TQueryKey extends QueryKey = FindPetsByTagsQueryKey>(
  { query, headers }: FindPetsByTagsRequestConfig,
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByTagsStatus200, ResponseErrorConfig<FindPetsByTagsStatus400>, TData, TQueryData, TQueryKey>> & {
      client?: QueryClient
    }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookie' | 'url'>>
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
