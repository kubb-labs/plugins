import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { FindPetsByTagsXEXAMPLEKey } from '../../../models/ts/FindPetsByTagsXEXAMPLE'
import type { Pet } from '../../../models/ts/Pet'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { findPetsByTags } from '../../axios/petService/findPetsByTags'

export const findPetsByTagsQueryKey = ({
  query,
}: Omit<
  {
    body?: never
    path?: never
    query?: {
      tags?: Array<string>
      page?: string
      pageSize?: number
    }
    headers: {
      'X-EXAMPLE': FindPetsByTagsXEXAMPLEKey
    }
  },
  'headers'
> = {}) => [{ url: '/pet/findByTags' }, ...(query ? [query] : [])] as const

type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>

export function findPetsByTagsQueryOptions(
  {
    query,
    headers,
  }: {
    body?: never
    path?: never
    query?: {
      tags?: Array<string>
      page?: string
      pageSize?: number
    }
    headers: {
      'X-EXAMPLE': FindPetsByTagsXEXAMPLEKey
    }
  },
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> = {},
) {
  const queryKey = findPetsByTagsQueryKey({ query })
  return queryOptions<Array<Pet>, ResponseErrorConfig<unknown>, Array<Pet>, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      return findPetsByTags({ ...config, query, headers, signal: config.signal ?? signal, throwOnError: true }).unwrap()
    },
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function useFindPetsByTags<TData = Array<Pet>, TQueryData = Array<Pet>, TQueryKey extends QueryKey = FindPetsByTagsQueryKey>(
  {
    headers,
    query,
  }: {
    headers:
      | {
          body?: never
          path?: never
          query?: {
            tags?: Array<string>
            page?: string
            pageSize?: number
          }
          headers: {
            'X-EXAMPLE': FindPetsByTagsXEXAMPLEKey
          }
        }['headers']
      | (() => {
          body?: never
          path?: never
          query?: {
            tags?: Array<string>
            page?: string
            pageSize?: number
          }
          headers: {
            'X-EXAMPLE': FindPetsByTagsXEXAMPLEKey
          }
        }['headers'])
    query?:
      | {
          body?: never
          path?: never
          query?: {
            tags?: Array<string>
            page?: string
            pageSize?: number
          }
          headers: {
            'X-EXAMPLE': FindPetsByTagsXEXAMPLEKey
          }
        }['query']
      | (() => {
          body?: never
          path?: never
          query?: {
            tags?: Array<string>
            page?: string
            pageSize?: number
          }
          headers: {
            'X-EXAMPLE': FindPetsByTagsXEXAMPLEKey
          }
        }['query'])
  },
  options: {
    query?: Partial<QueryObserverOptions<Array<Pet>, ResponseErrorConfig<unknown>, TData, TQueryData, TQueryKey>> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>
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

  queryResult.queryKey = queryKey as TQueryKey

  return queryResult
}
