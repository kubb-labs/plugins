import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { AddPetRequest } from '../../../models/ts/AddPetRequest'
import type { Pet } from '../../../models/ts/Pet'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addPet } from '../../axios/petService/addPet'
import { mutationOptions, useMutation } from '@tanstack/react-query'

type AddPetStatus405 = {
  code?: number
  message?: string
}

type AddPetResponse = AddPetStatus405 | (Omit<NonNullable<Pet>, 'name'> | string)

type AddPetOptions =
  | {
      body: AddPetRequest
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

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export function addPetMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'contentType' | 'throwOnError'>> = {},
) {
  const mutationKey = addPetMutationKey()
  return mutationOptions<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, AddPetOptions, TContext>({
    mutationKey,
    mutationFn: async (variables) => {
      return addPet({ ...config, ...variables, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `POST /pet`
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 */
export function useAddPet<TContext>(
  options: {
    mutation?: UseMutationOptions<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, AddPetOptions, TContext> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'contentType' | 'throwOnError'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addPetMutationKey()

  const baseOptions = addPetMutationOptions(config) as UseMutationOptions<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, AddPetOptions, TContext>

  return useMutation<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, AddPetOptions, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, AddPetOptions, TContext>
}
