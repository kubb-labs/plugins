import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { LoginUserQueryUsername, LoginUserQueryPassword, LoginUserStatus200, LoginUserStatus400 } from '../../../models/ts/user/LoginUser.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { loginUser } from '../../axios/userService/loginUser.ts'

export const loginUserQueryKey = (params?: { username?: LoginUserQueryUsername; password?: LoginUserQueryPassword }) =>
  [{ url: '/user/login' }, ...(params ? [params] : [])] as const

type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>

export function loginUserQueryOptions(
  { params }: { params?: { username?: LoginUserQueryUsername; password?: LoginUserQueryPassword } } = {},
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const queryKey = loginUserQueryKey(params)
  return queryOptions<
    { status: 200; data: LoginUserStatus200; statusText: string },
    ResponseErrorConfig<LoginUserStatus400>,
    { status: 200; data: LoginUserStatus200; statusText: string },
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      return loginUser({ params }, { ...config, signal: config.signal ?? signal })
    },
  })
}

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export function useLoginUser<
  TData = { status: 200; data: LoginUserStatus200; statusText: string },
  TQueryData = { status: 200; data: LoginUserStatus200; statusText: string },
  TQueryKey extends QueryKey = LoginUserQueryKey,
>(
  { params }: { params?: { username?: LoginUserQueryUsername; password?: LoginUserQueryPassword } } = {},
  options: {
    query?: Partial<
      QueryObserverOptions<{ status: 200; data: LoginUserStatus200; statusText: string }, ResponseErrorConfig<LoginUserStatus400>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const queryKey = resolvedOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useQuery(
    {
      ...loginUserQueryOptions({ params }, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<LoginUserStatus400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
