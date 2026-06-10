import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { LogoutUserStatusDefault } from '../../../models/ts/user/LogoutUser.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { logoutUser } from '../../axios/userService/logoutUser.ts'

export const logoutUserQueryKey = () => [{ url: '/user/logout' }] as const

type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>

export function logoutUserQueryOptions(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const queryKey = logoutUserQueryKey()
  return queryOptions<
    { status: number; data: LogoutUserStatusDefault; statusText: string },
    ResponseErrorConfig<Error>,
    { status: number; data: LogoutUserStatusDefault; statusText: string },
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      return logoutUser({ ...config, signal: config.signal ?? signal })
    },
  })
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export function useLogoutUser<
  TData = { status: number; data: LogoutUserStatusDefault; statusText: string },
  TQueryData = { status: number; data: LogoutUserStatusDefault; statusText: string },
  TQueryKey extends QueryKey = LogoutUserQueryKey,
>(
  options: {
    query?: Partial<
      QueryObserverOptions<{ status: number; data: LogoutUserStatusDefault; statusText: string }, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const queryKey = resolvedOptions?.queryKey ?? logoutUserQueryKey()

  const query = useQuery(
    {
      ...logoutUserQueryOptions(config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
