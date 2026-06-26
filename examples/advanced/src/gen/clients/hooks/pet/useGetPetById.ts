import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.ts'
import type { GetPetByIdRequestConfig, GetPetByIdStatus200, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../../models/ts/pet/GetPetById.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { getPetById } from '../../axios/petService/getPetById.ts'

export const getPetByIdQueryKey = ({ path }: Omit<GetPetByIdRequestConfig, 'headers'>) => [{ url: '/pet/:petId:search', params: path }] as const

type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

export function getPetByIdQueryOptions(
  { path }: GetPetByIdRequestConfig,
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookie' | 'url'>> = {},
) {
  const queryKey = getPetByIdQueryKey({ path })
  return queryOptions<GetPetByIdStatus200, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>, GetPetByIdStatus200, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      const { data } = await getPetById({ ...config, path, signal: config.signal ?? signal, throwOnError: true })
      return data
    },
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export function useGetPetById<TData = GetPetByIdStatus200, TQueryData = GetPetByIdStatus200, TQueryKey extends QueryKey = GetPetByIdQueryKey>(
  { path }: GetPetByIdRequestConfig,
  options: {
    query?: Partial<QueryObserverOptions<GetPetByIdStatus200, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>, TData, TQueryData, TQueryKey>> & {
      client?: QueryClient
    }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookie' | 'url'>>
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const queryKey = resolvedOptions?.queryKey ?? getPetByIdQueryKey({ path })

  const queryResult = useQuery(
    {
      ...getPetByIdQueryOptions({ path }, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>> & { queryKey: TQueryKey }

  queryResult.queryKey = queryKey as TQueryKey

  return queryResult
}
