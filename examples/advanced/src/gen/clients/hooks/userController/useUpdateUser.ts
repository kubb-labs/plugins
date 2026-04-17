import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UpdateUserData, UpdateUserPathUsername, UpdateUserResponse } from '../../../models/ts/userController/UpdateUser.ts'
import { updateUser } from '../../axios/userService/updateUser.ts'

export const updateUserMutationKey = () => [{ url: '/user/:username' }] as const

export type UpdateUserMutationKey = ReturnType<typeof updateUserMutationKey>

export function updateUserMutationOptions<TContext = unknown>(config: Partial<RequestConfig<UpdateUserData>> & { client?: Client } = {}) {
  const mutationKey = updateUserMutationKey()
  return mutationOptions<ResponseConfig<UpdateUserResponse>, ResponseErrorConfig<Error>, { username: UpdateUserPathUsername; data?: UpdateUserData }, TContext>(
    {
      mutationKey,
      mutationFn: async ({ username, data }) => {
        return updateUser({ username, data }, config)
      },
    },
  )
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
      { username: UpdateUserPathUsername; data?: UpdateUserData },
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
    { username: UpdateUserPathUsername; data?: UpdateUserData },
    TContext
  >

  return useMutation<ResponseConfig<UpdateUserResponse>, ResponseErrorConfig<Error>, { username: UpdateUserPathUsername; data?: UpdateUserData }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<UpdateUserResponse>, ResponseErrorConfig<Error>, { username: UpdateUserPathUsername; data?: UpdateUserData }, TContext>
}
