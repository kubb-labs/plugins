import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { CreateUserData, CreateUserResponse } from '../../../models/ts/userController/CreateUser.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createUser } from '../../axios/userService/createUser.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createUserMutationKey = () => [{ url: '/user' }] as const

export function createUserMutationOptions<TContext = unknown>(config: Partial<RequestConfig<CreateUserData>> & { client?: Client } = {}) {
  const mutationKey = createUserMutationKey()
  return mutationOptions<ResponseConfig<CreateUserResponse>, ResponseErrorConfig<Error>, { data?: CreateUserData }, TContext>({
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
    mutation?: UseMutationOptions<ResponseConfig<CreateUserResponse>, ResponseErrorConfig<Error>, { data?: CreateUserData }, TContext> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig<CreateUserData>> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createUserMutationKey()

  const baseOptions = createUserMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreateUserResponse>,
    ResponseErrorConfig<Error>,
    { data?: CreateUserData },
    TContext
  >

  return useMutation<ResponseConfig<CreateUserResponse>, ResponseErrorConfig<Error>, { data?: CreateUserData }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<CreateUserResponse>, ResponseErrorConfig<Error>, { data?: CreateUserData }, TContext>
}
