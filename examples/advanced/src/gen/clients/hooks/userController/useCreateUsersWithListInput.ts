import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUsersWithListInputData, CreateUsersWithListInputResponse } from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUsersWithListInput } from '../../axios/userService/createUsersWithListInput.ts'

export const createUsersWithListInputMutationKey = () => [{ url: '/user/createWithList' }] as const

export type CreateUsersWithListInputMutationKey = ReturnType<typeof createUsersWithListInputMutationKey>

export function createUsersWithListInputMutationOptions<TContext = unknown>(
  config: Partial<RequestConfig<CreateUsersWithListInputData>> & { client?: Client } = {},
) {
  const mutationKey = createUsersWithListInputMutationKey()
  return mutationOptions<ResponseConfig<CreateUsersWithListInputResponse>, ResponseErrorConfig<Error>, { data?: CreateUsersWithListInputData }, TContext>({
    mutationKey,
    mutationFn: async ({ data }) => {
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
    mutation?: UseMutationOptions<
      ResponseConfig<CreateUsersWithListInputResponse>,
      ResponseErrorConfig<Error>,
      { data?: CreateUsersWithListInputData },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<CreateUsersWithListInputData>> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createUsersWithListInputMutationKey()

  const baseOptions = createUsersWithListInputMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreateUsersWithListInputResponse>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputData },
    TContext
  >

  return useMutation<ResponseConfig<CreateUsersWithListInputResponse>, ResponseErrorConfig<Error>, { data?: CreateUsersWithListInputData }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<CreateUsersWithListInputResponse>, ResponseErrorConfig<Error>, { data?: CreateUsersWithListInputData }, TContext>
}
