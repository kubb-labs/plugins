import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { CreateUsersWithListInputResponse } from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createUsersWithListInput } from '../../axios/userService/createUsersWithListInput.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createUsersWithListInputMutationKey = () => [{ url: '/user/createWithList' }] as const

export function createUsersWithListInputMutationOptions<TContext = unknown>(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const mutationKey = createUsersWithListInputMutationKey()
  return mutationOptions<ResponseConfig<CreateUsersWithListInputResponse>, ResponseErrorConfig<Error>, void, TContext>({
    mutationKey,
    mutationFn: async (_) => {
      return createUsersWithListInput({ data }, config)
    },
  })
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export function useCreateUsersWithListInput<TContext>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<CreateUsersWithListInputResponse>, ResponseErrorConfig<Error>, void, TContext> & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createUsersWithListInputMutationKey()

  const baseOptions = createUsersWithListInputMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreateUsersWithListInputResponse>,
    ResponseErrorConfig<Error>,
    void,
    TContext
  >

  return useMutation<ResponseConfig<CreateUsersWithListInputResponse>, ResponseErrorConfig<Error>, void, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<CreateUsersWithListInputResponse>, ResponseErrorConfig<Error>, void, TContext>
}
