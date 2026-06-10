import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeleteUserPathUsername, DeleteUserStatus400, DeleteUserStatus404 } from '../../../models/ts/user/DeleteUser.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { deleteUser } from '../../axios/userService/deleteUser.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const deleteUserMutationKey = () => [{ url: '/user/:username' }] as const

export function deleteUserMutationOptions<TContext = unknown>(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const mutationKey = deleteUserMutationKey()
  return mutationOptions<
    { status: 400; data: DeleteUserStatus400; statusText: string } | { status: 404; data: DeleteUserStatus404; statusText: string },
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
      { status: 400; data: DeleteUserStatus400; statusText: string } | { status: 404; data: DeleteUserStatus404; statusText: string },
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
    { status: 400; data: DeleteUserStatus400; statusText: string } | { status: 404; data: DeleteUserStatus404; statusText: string },
    ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>,
    { username: DeleteUserPathUsername },
    TContext
  >

  return useMutation<
    { status: 400; data: DeleteUserStatus400; statusText: string } | { status: 404; data: DeleteUserStatus404; statusText: string },
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
    { status: 400; data: DeleteUserStatus400; statusText: string } | { status: 404; data: DeleteUserStatus404; statusText: string },
    ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>,
    { username: DeleteUserPathUsername },
    TContext
  >
}
