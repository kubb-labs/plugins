import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updatePet } from '../../axios/petService/updatePet'
import { mutationOptions, useMutation } from '@tanstack/react-query'

type UpdatePetStatus200 = Omit<NonNullable<Pet>, 'name'> | string

type UpdatePetStatus202 = {
  id?: number
}

type UpdatePetOptions =
  | {
      body: Omit<NonNullable<Pet>, 'id'>
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
        | 'application/xml'
        | {
            request: 'application/xml'
          }
    }
  | {
      body: Omit<NonNullable<Pet>, 'id'>
      path?: never
      query?: never
      headers?: never
      contentType:
        | 'application/x-www-form-urlencoded'
        | {
            request: 'application/x-www-form-urlencoded'
          }
    }

export const updatePetMutationKey = () => [{ url: '/pet' }] as const

export function updatePetMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'contentType' | 'throwOnError'>> = {},
) {
  const mutationKey = updatePetMutationKey()
  return mutationOptions<
    UpdatePetStatus200 | UpdatePetStatus202,
    ResponseErrorConfig<unknown | unknown | unknown>,
    UpdatePetOptions & { contentType?: string | { response?: 'application/json' | 'application/xml' } },
    TContext
  >({
    mutationKey,
    mutationFn: async (variables) => {
      return updatePet({ ...config, ...variables, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `PUT /pet`
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 */
export function useUpdatePet<TContext>(
  options: {
    mutation?: UseMutationOptions<
      UpdatePetStatus200 | UpdatePetStatus202,
      ResponseErrorConfig<unknown | unknown | unknown>,
      UpdatePetOptions & { contentType?: string | { response?: 'application/json' | 'application/xml' } },
      TContext
    > & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'contentType' | 'throwOnError'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updatePetMutationKey()

  const baseOptions = updatePetMutationOptions(config) as UseMutationOptions<
    UpdatePetStatus200 | UpdatePetStatus202,
    ResponseErrorConfig<unknown | unknown | unknown>,
    UpdatePetOptions & { contentType?: string | { response?: 'application/json' | 'application/xml' } },
    TContext
  >

  return useMutation<
    UpdatePetStatus200 | UpdatePetStatus202,
    ResponseErrorConfig<unknown | unknown | unknown>,
    UpdatePetOptions & { contentType?: string | { response?: 'application/json' | 'application/xml' } },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    UpdatePetStatus200 | UpdatePetStatus202,
    ResponseErrorConfig<unknown | unknown | unknown>,
    UpdatePetOptions & { contentType?: string | { response?: 'application/json' | 'application/xml' } },
    TContext
  >
}
