import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addFiles } from '../../axios/petService/addFiles'
import { mutationOptions, useMutation } from '@tanstack/react-query'

type AddFilesStatus200 = Omit<NonNullable<Pet>, 'name'>

type AddFilesOptions =
  | {
      body: {
        url: string
      }
      path?: never
      query?: never
      headers?: never
      contentType?:
        | 'application/json'
        | {
            request: 'application/json'
          }
    }
  | {
      body: Omit<NonNullable<Pet>, 'id'>
      path?: never
      query?: never
      headers?: never
      contentType:
        | 'multipart/form-data'
        | {
            request: 'multipart/form-data'
          }
    }

export const addFilesMutationKey = () => [{ url: '/pet/files' }] as const

export function addFilesMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'contentType' | 'throwOnError'>> = {},
) {
  const mutationKey = addFilesMutationKey()
  return mutationOptions<AddFilesStatus200, ResponseErrorConfig<unknown>, AddFilesOptions, TContext>({
    mutationKey,
    mutationFn: async (variables) => {
      return addFiles({ ...config, ...variables, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `POST /pet/files`
 * @description Place a new file in the store
 * @summary Place an file for a pet
 */
export function useAddFiles<TContext>(
  options: {
    mutation?: UseMutationOptions<AddFilesStatus200, ResponseErrorConfig<unknown>, AddFilesOptions, TContext> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'contentType' | 'throwOnError'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addFilesMutationKey()

  const baseOptions = addFilesMutationOptions(config) as UseMutationOptions<AddFilesStatus200, ResponseErrorConfig<unknown>, AddFilesOptions, TContext>

  return useMutation<AddFilesStatus200, ResponseErrorConfig<unknown>, AddFilesOptions, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<AddFilesStatus200, ResponseErrorConfig<unknown>, AddFilesOptions, TContext>
}
