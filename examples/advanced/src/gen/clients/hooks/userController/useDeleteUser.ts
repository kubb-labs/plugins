import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { DeleteUserResponse, DeleteUserPathUsername, DeleteUserStatus400, DeleteUserStatus404 } from '../../../models/ts/userController/DeleteUser.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { deleteUser } from '../../axios/userService/deleteUser.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const deleteUserMutationKey = () => [{ url: '/user/:username' }] as const

export type DeleteUserMutationKey = ReturnType<typeof deleteUserMutationKey>

export function deleteUserMutationOptions<TContext = unknown>(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const mutationKey = deleteUserMutationKey()
  return mutationOptions<
    ResponseConfig<DeleteUserResponse>,
    ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>,
    { username: DeleteUserPathUsername },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ username }) => {
      return deleteUser({ username }, config)
    },
  })
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export function useDeleteUser<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<DeleteUserResponse>,
      ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>,
      { username: DeleteUserPathUsername },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? deleteUserMutationKey()

  const baseOptions = deleteUserMutationOptions(config) as UseMutationOptions<
    ResponseConfig<DeleteUserResponse>,
    ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>,
    { username: DeleteUserPathUsername },
    TContext
  >

  return useMutation<
    ResponseConfig<DeleteUserResponse>,
    ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>,
    { username: DeleteUserPathUsername },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<DeleteUserResponse>,
    ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>,
    { username: DeleteUserPathUsername },
    TContext
  >
}
