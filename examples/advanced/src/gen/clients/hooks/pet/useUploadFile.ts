import type { RequestConfig, ResponseErrorConfig, RequestResult } from '../../../.kubb/client'
import type { ApiResponse } from '../../../models/ts/ApiResponse'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { uploadFile } from '../../axios/petService/uploadFile'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const uploadFileMutationKey = () => [{ url: '/pet/:petId/uploadImage' }] as const

export function uploadFileMutationOptions<TContext = unknown>(config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> = {}) {
  const mutationKey = uploadFileMutationKey()
  return mutationOptions<
    RequestResult<
      {
        '200': ApiResponse
      },
      true
    >,
    ResponseErrorConfig<Error>,
    {
      body: Blob
      path: {
        petId: number
      }
      query?: {
        additionalMetadata?: string
      }
      headers?: never
    },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ path, query, body }) => {
      return await uploadFile({ ...config, path, query, body, throwOnError: true })
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
      RequestResult<
        {
          '200': ApiResponse
        },
        true
      >,
      ResponseErrorConfig<Error>,
      {
        body: Blob
        path: {
          petId: number
        }
        query?: {
          additionalMetadata?: string
        }
        headers?: never
      },
      TContext
    > & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? uploadFileMutationKey()

  const baseOptions = uploadFileMutationOptions(config) as UseMutationOptions<
    RequestResult<
      {
        '200': ApiResponse
      },
      true
    >,
    ResponseErrorConfig<Error>,
    {
      body: Blob
      path: {
        petId: number
      }
      query?: {
        additionalMetadata?: string
      }
      headers?: never
    },
    TContext
  >

  return useMutation<
    RequestResult<
      {
        '200': ApiResponse
      },
      true
    >,
    ResponseErrorConfig<Error>,
    {
      body: Blob
      path: {
        petId: number
      }
      query?: {
        additionalMetadata?: string
      }
      headers?: never
    },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    RequestResult<
      {
        '200': ApiResponse
      },
      true
    >,
    ResponseErrorConfig<Error>,
    {
      body: Blob
      path: {
        petId: number
      }
      query?: {
        additionalMetadata?: string
      }
      headers?: never
    },
    TContext
  >
}
