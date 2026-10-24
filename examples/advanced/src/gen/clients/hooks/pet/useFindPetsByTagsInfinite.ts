import type { InfiniteData, QueryKey, QueryClient, InfiniteQueryObserverOptions, UseInfiniteQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { FindPetsByTagsXEXAMPLEKey } from '../../../models/ts/FindPetsByTagsXEXAMPLE'
import type { Pet } from '../../../models/ts/Pet'
import { infiniteQueryOptions, useInfiniteQuery } from '../../../../tanstack-query-hook'
import { findPetsByTags } from '../../axios/petService/findPetsByTags'

export const findPetsByTagsInfiniteQueryKey = ({
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
> = {}) => [{ url: '/pet/findByTags', infinite: true }, ...(query ? [query] : [])] as const

type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>

export function findPetsByTagsInfiniteQueryOptions(
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
  const queryKey = findPetsByTagsInfiniteQueryKey({ query })
  return infiniteQueryOptions<
    Array<Pet>,
    ResponseErrorConfig<unknown>,
    InfiniteData<Array<Pet>>,
    typeof queryKey,
    NonNullable<
      {
        tags?: Array<string>
        page?: string
        pageSize?: number
      }['pageSize']
    >
  >({
    queryKey,
    queryFn: async ({ signal, pageParam }) => {
      query = {
        ...(query ?? {}),
        ['pageSize']: pageParam as unknown as {
          tags?: Array<string>
          page?: string
          pageSize?: number
        }['pageSize'],
      } as {
        tags?: Array<string>
        page?: string
        pageSize?: number
      }
      return findPetsByTags({ ...config, query, headers, signal: config.signal ?? signal, throwOnError: true }).unwrap()
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
  TQueryFnData = Array<Pet>,
  TError = ResponseErrorConfig<unknown>,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
  TPageParam = NonNullable<
    {
      tags?: Array<string>
      page?: string
      pageSize?: number
    }['pageSize']
  >,
>(
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
