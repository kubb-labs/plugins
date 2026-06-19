import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddFilesRequestConfig, AddFilesData, AddFilesStatus200, AddFilesStatus405 } from '../../../models/ts/pet/AddFiles.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addFiles } from '../../axios/petService/addFiles.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addFilesMutationKey = () => [{ url: '/pet/files' }] as const

export function addFilesMutationOptions<TContext = unknown>(
  config: Partial<RequestConfig<AddFilesData>> & { client?: Client; contentType?: 'application/json' | 'multipart/form-data' } = {},
) {
  const mutationKey = addFilesMutationKey()
  return mutationOptions<
    { status: 200; data: AddFilesStatus200; statusText: string } | { status: 405; data: AddFilesStatus405; statusText: string },
    ResponseErrorConfig<AddFilesStatus405>,
    Omit<AddFilesRequestConfig, 'url'>,
    TContext
  >({
    mutationKey,
    mutationFn: async ({ body }) => {
      return addFiles({ body }, config)
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
    mutation?: UseMutationOptions<
      { status: 200; data: AddFilesStatus200; statusText: string } | { status: 405; data: AddFilesStatus405; statusText: string },
      ResponseErrorConfig<AddFilesStatus405>,
      Omit<AddFilesRequestConfig, 'url'>,
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<AddFilesData>> & { client?: Client; contentType?: 'application/json' | 'multipart/form-data' }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addFilesMutationKey()

  const baseOptions = addFilesMutationOptions(config) as UseMutationOptions<
    { status: 200; data: AddFilesStatus200; statusText: string } | { status: 405; data: AddFilesStatus405; statusText: string },
    ResponseErrorConfig<AddFilesStatus405>,
    Omit<AddFilesRequestConfig, 'url'>,
    TContext
  >

  return useMutation<
    { status: 200; data: AddFilesStatus200; statusText: string } | { status: 405; data: AddFilesStatus405; statusText: string },
    ResponseErrorConfig<AddFilesStatus405>,
    Omit<AddFilesRequestConfig, 'url'>,
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    { status: 200; data: AddFilesStatus200; statusText: string } | { status: 405; data: AddFilesStatus405; statusText: string },
    ResponseErrorConfig<AddFilesStatus405>,
    Omit<AddFilesRequestConfig, 'url'>,
    TContext
  >
}
