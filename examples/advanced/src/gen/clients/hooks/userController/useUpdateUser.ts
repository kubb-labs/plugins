import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { UpdateUserData, UpdateUserResponse, UpdateUserPathUsername } from '../../../models/ts/userController/UpdateUser.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updateUser } from '../../axios/userService/updateUser.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updateUserMutationKey = () => [{ url: '/user/:username' }] as const

export function updateUserMutationOptions<TContext = unknown>(config: Partial<RequestConfig<UpdateUserData>> & { client?: Client } = {}) {
  const mutationKey = updateUserMutationKey()
  return mutationOptions<
    ResponseConfig<UpdateUserResponse>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathUsername; data?: UpdateUserData; contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded' },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ username, data, contentType }) => {
      return updateUser({ username, data }, contentType, config)
    },
  })
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export function useUpdateUser<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<UpdateUserResponse>,
      ResponseErrorConfig<Error>,
      { username: UpdateUserPathUsername; data?: UpdateUserData; contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded' },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UpdateUserData>> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updateUserMutationKey()

  const baseOptions = updateUserMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UpdateUserResponse>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathUsername; data?: UpdateUserData; contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded' },
    TContext
  >

  return useMutation<
    ResponseConfig<UpdateUserResponse>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathUsername; data?: UpdateUserData; contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded' },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UpdateUserResponse>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathUsername; data?: UpdateUserData; contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded' },
    TContext
  >
}
