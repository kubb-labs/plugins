import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { AddFilesData, AddFilesStatus200, AddFilesStatus405 } from '../../../models/ts/petController/AddFiles.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addFiles } from '../../axios/petService/addFiles.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addFilesMutationKey = () => [{ url: '/pet/files' }] as const

export function addFilesMutationOptions<TContext = unknown>(
  config: Partial<RequestConfig<AddFilesData>> & { client?: Client; contentType?: 'application/json' | 'multipart/form-data' } = {},
) {
  const mutationKey = addFilesMutationKey()
  return mutationOptions<ResponseConfig<AddFilesStatus200>, ResponseErrorConfig<AddFilesStatus405>, { data: AddFilesData }, TContext>({
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
    mutation?: UseMutationOptions<ResponseConfig<AddFilesStatus200>, ResponseErrorConfig<AddFilesStatus405>, { data: AddFilesData }, TContext> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig<AddFilesData>> & { client?: Client; contentType?: 'application/json' | 'multipart/form-data' }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addFilesMutationKey()

  const baseOptions = addFilesMutationOptions(config) as UseMutationOptions<
    ResponseConfig<AddFilesStatus200>,
    ResponseErrorConfig<AddFilesStatus405>,
    { data: AddFilesData },
    TContext
  >

  return useMutation<ResponseConfig<AddFilesStatus200>, ResponseErrorConfig<AddFilesStatus405>, { data: AddFilesData }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<AddFilesStatus200>, ResponseErrorConfig<AddFilesStatus405>, { data: AddFilesData }, TContext>
}
