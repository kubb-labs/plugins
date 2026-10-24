import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { AddPetRequest } from '../../../models/ts/AddPetRequest'
import type { Pet } from '../../../models/ts/Pet'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addPet } from '../../axios/petService/addPet'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export function addPetMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & {
    contentType?: { request?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded' }
  } = {},
) {
  const mutationKey = addPetMutationKey()
  return mutationOptions<
    | {
        code?: number
        message?: string
      }
    | Omit<NonNullable<Pet>, 'name'>,
    ResponseErrorConfig<{
      code?: number
      message?: string
    }>,
    {
      body: AddPetRequest | Omit<NonNullable<Pet>, 'id'>
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ body }) => {
      return addPet({ ...config, body, throwOnError: true }).unwrap()
    },
  })
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function useAddPet<TContext>(
  options: {
    mutation?: UseMutationOptions<
      | {
          code?: number
          message?: string
        }
      | Omit<NonNullable<Pet>, 'name'>,
      ResponseErrorConfig<{
        code?: number
        message?: string
      }>,
      {
        body: AddPetRequest | Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
      },
      TContext
    > & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & {
      contentType?: { request?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded' }
    }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addPetMutationKey()

  const baseOptions = addPetMutationOptions(config) as UseMutationOptions<
    | {
        code?: number
        message?: string
      }
    | Omit<NonNullable<Pet>, 'name'>,
    ResponseErrorConfig<{
      code?: number
      message?: string
    }>,
    {
      body: AddPetRequest | Omit<NonNullable<Pet>, 'id'>
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >

  return useMutation<
    | {
        code?: number
        message?: string
      }
    | Omit<NonNullable<Pet>, 'name'>,
    ResponseErrorConfig<{
      code?: number
      message?: string
    }>,
    {
      body: AddPetRequest | Omit<NonNullable<Pet>, 'id'>
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
    | {
        code?: number
        message?: string
      }
    | Omit<NonNullable<Pet>, 'name'>,
    ResponseErrorConfig<{
      code?: number
      message?: string
    }>,
    {
      body: AddPetRequest | Omit<NonNullable<Pet>, 'id'>
      path?: never
      query?: never
      headers?: never
    },
    TContext
  >
}
