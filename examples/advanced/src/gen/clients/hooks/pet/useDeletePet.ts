import type { RequestConfig, ResponseErrorConfig, RequestResult } from '../../../.kubb/client'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { deletePet } from '../../axios/petService/deletePet'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const deletePetMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export function deletePetMutationOptions<TContext = unknown>(config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> = {}) {
  const mutationKey = deletePetMutationKey()
  return mutationOptions<
    RequestResult<
      {
        '400': unknown
      },
      true
    >,
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
      return await deletePet({ ...config, path, headers, throwOnError: true })
    },
  })
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
 */
export function useDeletePet<TContext>(
  options: {
    mutation?: UseMutationOptions<
      RequestResult<
        {
          '400': unknown
        },
        true
      >,
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
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? deletePetMutationKey()

  const baseOptions = deletePetMutationOptions(config) as UseMutationOptions<
    RequestResult<
      {
        '400': unknown
      },
      true
    >,
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
    RequestResult<
      {
        '400': unknown
      },
      true
    >,
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
    RequestResult<
      {
        '400': unknown
      },
      true
    >,
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
