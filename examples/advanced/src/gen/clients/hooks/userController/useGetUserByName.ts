import type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryClient, QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import type {
  GetUserByNamePathUsername,
  GetUserByNameResponse,
  GetUserByNameStatus400,
  GetUserByNameStatus404,
} from '../../../models/ts/userController/GetUserByName.ts'
import { getUserByName } from '../../axios/userService/getUserByName.ts'

export const getUserByNameQueryKey = ({ username }: { username: GetUserByNamePathUsername }) =>
  [{ url: '/user/:username', params: { username: username } }] as const

type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>

export function getUserByNameQueryOptions({ username }: { username: GetUserByNamePathUsername }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const queryKey = getUserByNameQueryKey({ username })
  return queryOptions<
    ResponseConfig<GetUserByNameResponse>,
    ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>,
    ResponseConfig<GetUserByNameResponse>,
    typeof queryKey
  >({
    enabled: !!username,
    queryKey,
    queryFn: async ({ signal }) => {
      return getUserByName({ username }, { ...config, signal: config.signal ?? signal })
    },
  })
}

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export function useGetUserByName<
  TData = ResponseConfig<GetUserByNameResponse>,
  TQueryData = ResponseConfig<GetUserByNameResponse>,
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(
  { username }: { username: GetUserByNamePathUsername },
  options: {
    query?: Partial<
      QueryObserverOptions<
        ResponseConfig<GetUserByNameResponse>,
        ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>,
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
  const queryKey = resolvedOptions?.queryKey ?? getUserByNameQueryKey({ username })

  const query = useQuery(
    {
      ...getUserByNameQueryOptions({ username }, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
