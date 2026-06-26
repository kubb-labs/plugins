import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.ts'
import type { AddFilesRequestConfig, AddFilesStatus200, AddFilesStatus405 } from '../../../models/ts/pet/AddFiles.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addFiles } from '../../axios/petService/addFiles.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addFilesMutationKey = () => [{ url: '/pet/files' }] as const

export function addFilesMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookie' | 'url'>> & {
    contentType?: 'application/json' | 'multipart/form-data'
  } = {},
) {
  const mutationKey = addFilesMutationKey()
  return mutationOptions<AddFilesStatus200, ResponseErrorConfig<AddFilesStatus405>, AddFilesRequestConfig, TContext>({
    mutationKey,
    mutationFn: async ({ body }) => {
      const { data } = await addFiles({ ...config, body, throwOnError: true })
      return data
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
    mutation?: UseMutationOptions<AddFilesStatus200, ResponseErrorConfig<AddFilesStatus405>, AddFilesRequestConfig, TContext> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookie' | 'url'>> & {
      contentType?: 'application/json' | 'multipart/form-data'
    }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addFilesMutationKey()

  const baseOptions = addFilesMutationOptions(config) as UseMutationOptions<
    AddFilesStatus200,
    ResponseErrorConfig<AddFilesStatus405>,
    AddFilesRequestConfig,
    TContext
  >

  return useMutation<AddFilesStatus200, ResponseErrorConfig<AddFilesStatus405>, AddFilesRequestConfig, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<AddFilesStatus200, ResponseErrorConfig<AddFilesStatus405>, AddFilesRequestConfig, TContext>
}
