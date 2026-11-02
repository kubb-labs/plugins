import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig, RequestResult } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { findPetsByStatus } from '../../axios/petService/findPetsByStatus'

export const findPetsByStatusQueryKey = ({
  path,
}: Omit<
  {
    body?: never
    path: {
      step_id: string
    }
    query?: never
    headers?: never
  },
  'headers'
>) => [{ url: '/pet/findByStatus/:step_id', params: path }] as const

type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

export function findPetsByStatusQueryOptions(
  {
    path,
  }: {
    body?: never
    path: {
      step_id: string
    }
    query?: never
    headers?: never
  },
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> = {},
) {
  const queryKey = findPetsByStatusQueryKey({ path })
  return queryOptions<
    RequestResult<
      {
        '200':
          | {
              contentType: 'application/json'
              data: Array<Pet>
            }
          | {
              contentType: 'application/xml'
              data: Array<Pet>
            }
        '400': unknown
      },
      true
    >,
    ResponseErrorConfig<unknown>,
    RequestResult<
      {
        '200':
          | {
              contentType: 'application/json'
              data: Array<Pet>
            }
          | {
              contentType: 'application/xml'
              data: Array<Pet>
            }
        '400': unknown
      },
      true
    >,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      return findPetsByStatus({ ...config, path, signal: config.signal ?? signal, throwOnError: true })
    },
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export function useFindPetsByStatus<
  TData = RequestResult<
    {
      '200':
        | {
            contentType: 'application/json'
            data: Array<Pet>
          }
        | {
            contentType: 'application/xml'
            data: Array<Pet>
          }
      '400': unknown
    },
    true
  >,
  TQueryData = RequestResult<
    {
      '200':
        | {
            contentType: 'application/json'
            data: Array<Pet>
          }
        | {
            contentType: 'application/xml'
            data: Array<Pet>
          }
      '400': unknown
    },
    true
  >,
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  {
    path,
  }: {
    path:
      | {
          body?: never
          path: {
            step_id: string
          }
          query?: never
          headers?: never
        }['path']
      | (() => {
          body?: never
          path: {
            step_id: string
          }
          query?: never
          headers?: never
        }['path'])
  },
  options: {
    query?: Partial<
      QueryObserverOptions<
        RequestResult<
          {
            '200':
              | {
                  contentType: 'application/json'
                  data: Array<Pet>
                }
              | {
                  contentType: 'application/xml'
                  data: Array<Pet>
                }
            '400': unknown
          },
          true
        >,
        ResponseErrorConfig<unknown>,
        TData,
        TQueryData,
        TQueryKey
      >
    > & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const resolvedParams = { path: typeof path === 'function' ? path() : path }
  const queryKey = resolvedOptions?.queryKey ?? findPetsByStatusQueryKey(resolvedParams)

  const queryResult = useQuery(
    {
      ...findPetsByStatusQueryOptions(resolvedParams, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<unknown>> & { queryKey: TQueryKey }

  queryResult.queryKey = queryKey as TQueryKey

  return queryResult
}
