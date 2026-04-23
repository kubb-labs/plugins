import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { AddFilesResponse, AddFilesStatus405 } from '../../../models/ts/petController/AddFiles.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addFiles } from '../../axios/petService/addFiles.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addFilesMutationKey = () => [{ url: '/pet/files' }] as const

export function addFilesMutationOptions<TContext = unknown>(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const mutationKey = addFilesMutationKey()
  return mutationOptions<ResponseConfig<AddFilesResponse>, ResponseErrorConfig<AddFilesStatus405>, void, TContext>({
    mutationKey,
    mutationFn: async (_) => {
      return addFiles({ data }, config)
    },
  })
}

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export function useAddFiles<TContext>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<AddFilesResponse>, ResponseErrorConfig<AddFilesStatus405>, void, TContext> & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addFilesMutationKey()

  const baseOptions = addFilesMutationOptions(config) as UseMutationOptions<
    ResponseConfig<AddFilesResponse>,
    ResponseErrorConfig<AddFilesStatus405>,
    void,
    TContext
  >

  return useMutation<ResponseConfig<AddFilesResponse>, ResponseErrorConfig<AddFilesStatus405>, void, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<AddFilesResponse>, ResponseErrorConfig<AddFilesStatus405>, void, TContext>
}
