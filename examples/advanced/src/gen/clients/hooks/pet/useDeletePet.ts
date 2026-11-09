import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { deletePet } from '../../axios/petService/deletePet'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const deletePetMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export function deletePetMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>> = {},
) {
  const mutationKey = deletePetMutationKey()
  return mutationOptions<
    unknown,
    ResponseErrorConfig<unknown>,
    {
      body?: never
      path: {
        petId: number
      }
      query?: never
      headers?: {
        api_key?: string
      }
    },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ path, headers }) => {
      return deletePet({ ...config, path, headers, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `DELETE /pet/{petId}:search`
 * @description delete a pet
 * @summary Deletes a pet
 */
export function useDeletePet<TContext>(
  options: {
    mutation?: UseMutationOptions<
      unknown,
      ResponseErrorConfig<unknown>,
      {
        body?: never
        path: {
          petId: number
        }
        query?: never
        headers?: {
          api_key?: string
        }
      },
      TContext
    > & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? deletePetMutationKey()

  const baseOptions = deletePetMutationOptions(config) as UseMutationOptions<
    unknown,
    ResponseErrorConfig<unknown>,
    {
      body?: never
      path: {
        petId: number
      }
      query?: never
      headers?: {
        api_key?: string
      }
    },
    TContext
  >

  return useMutation<
    unknown,
    ResponseErrorConfig<unknown>,
    {
      body?: never
      path: {
        petId: number
      }
      query?: never
      headers?: {
        api_key?: string
      }
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
    unknown,
    ResponseErrorConfig<unknown>,
    {
      body?: never
      path: {
        petId: number
      }
      query?: never
      headers?: {
        api_key?: string
      }
    },
    TContext
  >
}
