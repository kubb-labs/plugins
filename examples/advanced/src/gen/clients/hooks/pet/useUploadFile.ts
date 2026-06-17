import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UploadFilePathPetId, UploadFileQueryAdditionalMetadata, UploadFileStatus200 } from '../../../models/ts/pet/UploadFile.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { uploadFile } from '../../axios/petService/uploadFile.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const uploadFileMutationKey = () => [{ url: '/pet/:petId/uploadImage' }] as const

export function uploadFileMutationOptions<TContext = unknown>(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const mutationKey = uploadFileMutationKey()
  return mutationOptions<
    { status: 200; data: UploadFileStatus200; statusText: string },
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathPetId; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ petId, params }) => {
      return uploadFile({ petId, params }, config)
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
      { petId: UploadFilePathPetId; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? uploadFileMutationKey()

  const baseOptions = uploadFileMutationOptions(config) as UseMutationOptions<
    { status: 200; data: UploadFileStatus200; statusText: string },
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathPetId; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
    TContext
  >

  return useMutation<
    { status: 200; data: UploadFileStatus200; statusText: string },
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathPetId; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    { status: 200; data: UploadFileStatus200; statusText: string },
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathPetId; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
    TContext
  >
}
