import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddFilesData, AddFilesResponse, AddFilesStatus405 } from '../../../models/ts/petController/AddFiles.ts'
import { addFiles } from '../../axios/petService/addFiles.ts'

export const addFilesMutationKey = () => [{ url: '/pet/files' }] as const

export function addFilesMutationOptions<TContext = unknown>(config: Partial<RequestConfig<AddFilesData>> & { client?: Client } = {}) {
  const mutationKey = addFilesMutationKey()
  return mutationOptions<ResponseConfig<AddFilesResponse>, ResponseErrorConfig<AddFilesStatus405>, { data: AddFilesData }, TContext>({
    mutationKey,
    mutationFn: async ({ data }) => {
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
    mutation?: UseMutationOptions<ResponseConfig<AddFilesResponse>, ResponseErrorConfig<AddFilesStatus405>, { data: AddFilesData }, TContext> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig<AddFilesData>> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addFilesMutationKey()

  const baseOptions = addFilesMutationOptions(config) as UseMutationOptions<
    ResponseConfig<AddFilesResponse>,
    ResponseErrorConfig<AddFilesStatus405>,
    { data: AddFilesData },
    TContext
  >

  return useMutation<ResponseConfig<AddFilesResponse>, ResponseErrorConfig<AddFilesStatus405>, { data: AddFilesData }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<AddFilesResponse>, ResponseErrorConfig<AddFilesStatus405>, { data: AddFilesData }, TContext>
}
