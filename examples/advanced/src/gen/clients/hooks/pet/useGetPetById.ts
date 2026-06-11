import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { GetPetByIdPathPetId, GetPetByIdStatus200, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../../models/ts/pet/GetPetById.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { getPetById } from '../../axios/petService/getPetById.ts'

export const getPetByIdQueryKey = ({ petId }: { petId?: GetPetByIdPathPetId } = {}) => [{ url: '/pet/:petId:search', params: { petId: petId } }] as const

type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

export function getPetByIdQueryOptions({ petId }: { petId?: GetPetByIdPathPetId } = {}, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const queryKey = getPetByIdQueryKey({ petId })
  return queryOptions<
    { status: 200; data: GetPetByIdStatus200; statusText: string },
    ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>,
    { status: 200; data: GetPetByIdStatus200; statusText: string },
    typeof queryKey
  >({
    enabled: !!petId,
    queryKey,
    queryFn: async ({ signal }) => {
      return getPetById({ petId: petId! }, { ...config, signal: config.signal ?? signal })
    },
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export function useGetPetById<
  TData = { status: 200; data: GetPetByIdStatus200; statusText: string },
  TQueryData = { status: 200; data: GetPetByIdStatus200; statusText: string },
  TQueryKey extends QueryKey = GetPetByIdQueryKey,
>(
  { petId }: { petId?: GetPetByIdPathPetId } = {},
  options: {
    query?: Partial<
      QueryObserverOptions<
        { status: 200; data: GetPetByIdStatus200; statusText: string },
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
  const queryKey = resolvedOptions?.queryKey ?? getPetByIdQueryKey({ petId })

  const query = useQuery(
    {
      ...getPetByIdQueryOptions({ petId }, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
