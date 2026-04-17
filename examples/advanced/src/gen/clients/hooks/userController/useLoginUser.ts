import type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryClient, QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import type { LoginUserQueryPassword, LoginUserQueryUsername, LoginUserResponse, LoginUserStatus400 } from '../../../models/ts/userController/LoginUser.ts'
import { loginUser } from '../../axios/userService/loginUser.ts'

export const loginUserQueryKey = (params?: { username?: LoginUserQueryUsername; password?: LoginUserQueryPassword }) =>
  [{ url: '/user/login' }, ...(params ? [params] : [])] as const

export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>

export function loginUserQueryOptions(
  { params }: { params?: { username?: LoginUserQueryUsername; password?: LoginUserQueryPassword } } = {},
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const queryKey = loginUserQueryKey(params)
  return queryOptions<ResponseConfig<LoginUserResponse>, ResponseErrorConfig<LoginUserStatus400>, ResponseConfig<LoginUserResponse>, typeof queryKey>({
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
  TData = ResponseConfig<LoginUserResponse>,
  TQueryData = ResponseConfig<LoginUserResponse>,
  TQueryKey extends QueryKey = LoginUserQueryKey,
>(
  { params }: { params?: { username?: LoginUserQueryUsername; password?: LoginUserQueryPassword } } = {},
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<LoginUserResponse>, ResponseErrorConfig<LoginUserStatus400>, TData, TQueryData, TQueryKey>> & {
      client?: QueryClient
    }
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
