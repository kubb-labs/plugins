import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig, RequestResult } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { getPetById } from '../../axios/petService/getPetById'

export const getPetByIdQueryKey = ({
  path,
}: Omit<
  {
    body?: never
    path: {
      petId: number
    }
    query?: never
    headers?: never
  },
  'headers'
>) => [{ url: '/pet/:petId:search', params: path }] as const

type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

export function getPetByIdQueryOptions(
  {
    path,
  }: {
    body?: never
    path: {
      petId: number
    }
    query?: never
    headers?: never
  },
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> = {},
) {
  const queryKey = getPetByIdQueryKey({ path })
  return queryOptions<
    RequestResult<
      {
        '200':
          | {
              contentType: 'application/json'
              data: Omit<NonNullable<Pet>, 'name'>
            }
          | {
              contentType: 'application/xml'
              data: Omit<NonNullable<Pet>, 'name'>
            }
        '400': unknown
        '404': unknown
      },
      true
    >,
    ResponseErrorConfig<unknown | unknown>,
    RequestResult<
      {
        '200':
          | {
              contentType: 'application/json'
              data: Omit<NonNullable<Pet>, 'name'>
            }
          | {
              contentType: 'application/xml'
              data: Omit<NonNullable<Pet>, 'name'>
            }
        '400': unknown
        '404': unknown
      },
      true
    >,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      return await getPetById({ ...config, path, signal: config.signal ?? signal, throwOnError: true })
    },
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export function useGetPetById<
  TData = RequestResult<
    {
      '200':
        | {
            contentType: 'application/json'
            data: Omit<NonNullable<Pet>, 'name'>
          }
        | {
            contentType: 'application/xml'
            data: Omit<NonNullable<Pet>, 'name'>
          }
      '400': unknown
      '404': unknown
    },
    true
  >,
  TQueryData = RequestResult<
    {
      '200':
        | {
            contentType: 'application/json'
            data: Omit<NonNullable<Pet>, 'name'>
          }
        | {
            contentType: 'application/xml'
            data: Omit<NonNullable<Pet>, 'name'>
          }
      '400': unknown
      '404': unknown
    },
    true
  >,
  TQueryKey extends QueryKey = GetPetByIdQueryKey,
>(
  {
    path,
  }: {
    path:
      | {
          body?: never
          path: {
            petId: number
          }
          query?: never
          headers?: never
        }['path']
      | (() => {
          body?: never
          path: {
            petId: number
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
                  data: Omit<NonNullable<Pet>, 'name'>
                }
              | {
                  contentType: 'application/xml'
                  data: Omit<NonNullable<Pet>, 'name'>
                }
            '400': unknown
            '404': unknown
          },
          true
        >,
        ResponseErrorConfig<unknown | unknown>,
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
  const queryKey = resolvedOptions?.queryKey ?? getPetByIdQueryKey(resolvedParams)

  const queryResult = useQuery(
    {
      ...getPetByIdQueryOptions(resolvedParams, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<unknown | unknown>> & { queryKey: TQueryKey }

  queryResult.queryKey = queryKey as TQueryKey

  return queryResult
}
