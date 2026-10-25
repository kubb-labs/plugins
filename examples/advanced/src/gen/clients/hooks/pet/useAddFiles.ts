import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addFiles } from '../../axios/petService/addFiles'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addFilesMutationKey = () => [{ url: '/pet/files' }] as const

export function addFilesMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & {
    contentType?: { request?: 'application/json' | 'multipart/form-data' }
  } = {},
) {
  const mutationKey = addFilesMutationKey()
  return mutationOptions<
    Omit<NonNullable<Pet>, 'name'>,
    ResponseErrorConfig<unknown>,
    {
      body:
        | {
            url: string
          }
        | Omit<NonNullable<Pet>, 'id'>
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ body }) => {
      return addFiles({ ...config, body, throwOnError: true }).unwrap()
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
      Omit<NonNullable<Pet>, 'name'>,
      ResponseErrorConfig<unknown>,
      {
        body:
          | {
              url: string
            }
          | Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
      },
      TContext
    > & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & {
      contentType?: { request?: 'application/json' | 'multipart/form-data' }
    }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addFilesMutationKey()

  const baseOptions = addFilesMutationOptions(config) as UseMutationOptions<
    Omit<NonNullable<Pet>, 'name'>,
    ResponseErrorConfig<unknown>,
    {
      body:
        | {
            url: string
          }
        | Omit<NonNullable<Pet>, 'id'>
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >

  return useMutation<
    Omit<NonNullable<Pet>, 'name'>,
    ResponseErrorConfig<unknown>,
    {
      body:
        | {
            url: string
          }
        | Omit<NonNullable<Pet>, 'id'>
      path?: never
      query?: never
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
    Omit<NonNullable<Pet>, 'name'>,
    ResponseErrorConfig<unknown>,
    {
      body:
        | {
            url: string
          }
        | Omit<NonNullable<Pet>, 'id'>
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >
}
