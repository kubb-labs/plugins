import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UploadFileRequestConfig, UploadFileData, UploadFileStatus200 } from '../../../models/ts/pet/UploadFile.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { uploadFile } from '../../axios/petService/uploadFile.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const uploadFileMutationKey = () => [{ url: '/pet/:petId/uploadImage' }] as const

export function uploadFileMutationOptions<TContext = unknown>(config: Partial<RequestConfig<UploadFileData>> & { client?: Client } = {}) {
  const mutationKey = uploadFileMutationKey()
  return mutationOptions<{ status: 200; data: UploadFileStatus200; statusText: string }, ResponseErrorConfig<Error>, UploadFileRequestConfig, TContext>({
    mutationKey,
    mutationFn: async ({ path, query, body }) => {
      return uploadFile({ path, query, body }, config)
    },
  })
}

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export function useUploadFile<TContext>(
  options: {
    mutation?: UseMutationOptions<
      { status: 200; data: UploadFileStatus200; statusText: string },
      ResponseErrorConfig<Error>,
      UploadFileRequestConfig,
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UploadFileData>> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? uploadFileMutationKey()

  const baseOptions = uploadFileMutationOptions(config) as UseMutationOptions<
    { status: 200; data: UploadFileStatus200; statusText: string },
    ResponseErrorConfig<Error>,
    UploadFileRequestConfig,
    TContext
  >

  return useMutation<{ status: 200; data: UploadFileStatus200; statusText: string }, ResponseErrorConfig<Error>, UploadFileRequestConfig, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<{ status: 200; data: UploadFileStatus200; statusText: string }, ResponseErrorConfig<Error>, UploadFileRequestConfig, TContext>
}
