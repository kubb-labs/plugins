import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { withQueryKey } from '../../../.kubb/withQueryKey'
import { getPetById } from '../../axios/petService/getPetById'

type GetPetByIdOptions = {
  body?: never
  path: {
    petId: number
  }
  query?: never
  headers?: never
}

type GetPetByIdStatus200 = Omit<NonNullable<Pet>, 'name'> | string

export const getPetByIdQueryKey = ({ path }: Omit<GetPetByIdOptions, 'headers'>) => [{ url: '/pet/:petId:search', params: path }] as const

type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

export function getPetByIdQueryOptions(
  { path }: GetPetByIdOptions,
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>> = {},
) {
  const queryKey = getPetByIdQueryKey({ path })
  return queryOptions<GetPetByIdStatus200, ResponseErrorConfig<unknown | unknown>, GetPetByIdStatus200, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      return getPetById({ ...config, path, signal: config.signal ?? signal, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `GET /pet/{petId}:search`
 * @description Returns a single pet
 * @summary Find pet by ID
 */
export function useGetPetById<TData = GetPetByIdStatus200, TQueryData = GetPetByIdStatus200, TQueryKey extends QueryKey = GetPetByIdQueryKey>(
  { path }: { path: GetPetByIdOptions['path'] | (() => GetPetByIdOptions['path']) },
  options: {
    query?: Partial<QueryObserverOptions<GetPetByIdStatus200, ResponseErrorConfig<unknown | unknown>, TData, TQueryData, TQueryKey>> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>>
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

  return withQueryKey(queryResult, queryKey as TQueryKey)
}
