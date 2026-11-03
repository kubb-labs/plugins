import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updatePetWithForm } from '../../axios/petService/updatePetWithForm'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updatePetWithFormMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export function updatePetWithFormMutationOptions<TContext = unknown>(config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> = {}) {
  const mutationKey = updatePetWithFormMutationKey()
  return mutationOptions<
    unknown,
    ResponseErrorConfig<unknown>,
    {
      body?: never
      path: {
        petId: number
      }
      query?: {
        name?: string
        status?: string
      }
      headers?: never
    },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ path, query }) => {
      return updatePetWithForm({ ...config, path, query, throwOnError: true }).unwrap()
    },
  })
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export function useUpdatePetWithForm<TContext>(
  options: {
    mutation?: UseMutationOptions<
      unknown,
      ResponseErrorConfig<unknown>,
      {
        body?: never
        path: {
          petId: number
        }
        query?: {
          name?: string
          status?: string
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
  const mutationKey = mutationOptions.mutationKey ?? updatePetWithFormMutationKey()

  const baseOptions = updatePetWithFormMutationOptions(config) as UseMutationOptions<
    unknown,
    ResponseErrorConfig<unknown>,
    {
      body?: never
      path: {
        petId: number
      }
      query?: {
        name?: string
        status?: string
      }
      headers?: never
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
      query?: {
        name?: string
        status?: string
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
    unknown,
    ResponseErrorConfig<unknown>,
    {
      body?: never
      path: {
        petId: number
      }
      query?: {
        name?: string
        status?: string
      }
      headers?: never
    },
    TContext
  >
}
