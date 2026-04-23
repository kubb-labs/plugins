import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { UploadFileData, UploadFileResponse, UploadFilePathPetId, UploadFileQueryAdditionalMetadata } from '../../../models/ts/petController/UploadFile.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { uploadFile } from '../../axios/petService/uploadFile.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const uploadFileMutationKey = () => [{ url: '/pet/:petId/uploadImage' }] as const

export function uploadFileMutationOptions<TContext = unknown>(config: Partial<RequestConfig<UploadFileData>> & { client?: Client } = {}) {
  const mutationKey = uploadFileMutationKey()
  return mutationOptions<
    ResponseConfig<UploadFileResponse>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathPetId; data: UploadFileData; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ petId, data, params }) => {
      return uploadFile({ petId, data, params }, config)
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
      ResponseConfig<UploadFileResponse>,
      ResponseErrorConfig<Error>,
      { petId: UploadFilePathPetId; data: UploadFileData; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UploadFileData>> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? uploadFileMutationKey()

  const baseOptions = uploadFileMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UploadFileResponse>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathPetId; data: UploadFileData; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
    TContext
  >

  return useMutation<
    ResponseConfig<UploadFileResponse>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathPetId; data: UploadFileData; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UploadFileResponse>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathPetId; data: UploadFileData; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
    TContext
  >
}
