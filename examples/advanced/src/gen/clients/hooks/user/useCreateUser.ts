import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUserData, CreateUserStatusDefault } from '../../../models/ts/user/CreateUser.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createUser } from '../../axios/userService/createUser.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createUserMutationKey = () => [{ url: '/user' }] as const

export function createUserMutationOptions<TContext = unknown>(
  config: Partial<RequestConfig<CreateUserData>> & {
    client?: Client
    contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
  } = {},
) {
  const mutationKey = createUserMutationKey()
  return mutationOptions<
    { status: number; data: CreateUserStatusDefault; statusText: string },
    ResponseErrorConfig<Error>,
    { data?: CreateUserData },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ data }) => {
      return createUser({ data }, config)
    },
  })
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export function useCreateUser<TContext>(
  options: {
    mutation?: UseMutationOptions<
      { status: number; data: CreateUserStatusDefault; statusText: string },
      ResponseErrorConfig<Error>,
      { data?: CreateUserData },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<CreateUserData>> & {
      client?: Client
      contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
    }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createUserMutationKey()

  const baseOptions = createUserMutationOptions(config) as UseMutationOptions<
    { status: number; data: CreateUserStatusDefault; statusText: string },
    ResponseErrorConfig<Error>,
    { data?: CreateUserData },
    TContext
  >

  return useMutation<{ status: number; data: CreateUserStatusDefault; statusText: string }, ResponseErrorConfig<Error>, { data?: CreateUserData }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<{ status: number; data: CreateUserStatusDefault; statusText: string }, ResponseErrorConfig<Error>, { data?: CreateUserData }, TContext>
}
