import type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryClient, QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import type { FindPetsByStatusPathStepId, FindPetsByStatusResponse, FindPetsByStatusStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'
import { findPetsByStatus } from '../../axios/petService/findPetsByStatus.ts'

export const findPetsByStatusQueryKey = ({ stepId }: { stepId: FindPetsByStatusPathStepId }) =>
  [{ url: '/pet/findByStatus/:step_id', params: { stepId: stepId } }] as const

export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

export function findPetsByStatusQueryOptions({ stepId }: { stepId: FindPetsByStatusPathStepId }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const queryKey = findPetsByStatusQueryKey({ stepId })
  return queryOptions<
    ResponseConfig<FindPetsByStatusResponse>,
    ResponseErrorConfig<FindPetsByStatusStatus400>,
    ResponseConfig<FindPetsByStatusResponse>,
    typeof queryKey
  >({
    enabled: !!stepId,
    queryKey,
    queryFn: async ({ signal }) => {
      return findPetsByStatus({ stepId }, { ...config, signal: config.signal ?? signal })
    },
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export function useFindPetsByStatus<
  TData = ResponseConfig<FindPetsByStatusResponse>,
  TQueryData = ResponseConfig<FindPetsByStatusResponse>,
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  { stepId }: { stepId: FindPetsByStatusPathStepId },
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<FindPetsByStatusResponse>, ResponseErrorConfig<FindPetsByStatusStatus400>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const queryKey = resolvedOptions?.queryKey ?? findPetsByStatusQueryKey({ stepId })

  const query = useQuery(
    {
      ...findPetsByStatusQueryOptions({ stepId }, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<FindPetsByStatusStatus400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
