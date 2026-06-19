import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { GetPetByIdRequestConfig, GetPetByIdStatus200, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../../models/ts/pet/GetPetById.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { getPetById } from '../../axios/petService/getPetById.ts'

export const getPetByIdQueryKey = ({ path }: Omit<GetPetByIdRequestConfig, 'url'>) => [{ url: '/pet/:petId:search', params: path }] as const

type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

export function getPetByIdQueryOptions({ path }: Omit<GetPetByIdRequestConfig, 'url'>, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const queryKey = getPetByIdQueryKey({ path })
  return queryOptions<
    | { status: 200; data: GetPetByIdStatus200; statusText: string }
    | { status: 400; data: GetPetByIdStatus400; statusText: string }
    | { status: 404; data: GetPetByIdStatus404; statusText: string },
    ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>,
    | { status: 200; data: GetPetByIdStatus200; statusText: string }
    | { status: 400; data: GetPetByIdStatus400; statusText: string }
    | { status: 404; data: GetPetByIdStatus404; statusText: string },
    typeof queryKey
  >({
    enabled: !!path,
    queryKey,
    queryFn: async ({ signal }) => {
      return getPetById({ path }, { ...config, signal: config.signal ?? signal })
    },
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export function useGetPetById<
  TData =
    | { status: 200; data: GetPetByIdStatus200; statusText: string }
    | { status: 400; data: GetPetByIdStatus400; statusText: string }
    | { status: 404; data: GetPetByIdStatus404; statusText: string },
  TQueryData =
    | { status: 200; data: GetPetByIdStatus200; statusText: string }
    | { status: 400; data: GetPetByIdStatus400; statusText: string }
    | { status: 404; data: GetPetByIdStatus404; statusText: string },
  TQueryKey extends QueryKey = GetPetByIdQueryKey,
>(
  { path }: Omit<GetPetByIdRequestConfig, 'url'>,
  options: {
    query?: Partial<
      QueryObserverOptions<
        | { status: 200; data: GetPetByIdStatus200; statusText: string }
        | { status: 400; data: GetPetByIdStatus400; statusText: string }
        | { status: 404; data: GetPetByIdStatus404; statusText: string },
        ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>,
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
