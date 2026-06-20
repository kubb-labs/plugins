import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddPetRequestConfig, AddPetData, AddPetStatus405, AddPetStatusDefault } from '../../../models/ts/pet/AddPet.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addPet } from '../../axios/petService/addPet.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export function addPetMutationOptions<TContext = unknown>(
  config: Partial<RequestConfig<AddPetData>> & {
    client?: Client
    contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
  } = {},
) {
  const mutationKey = addPetMutationKey()
  return mutationOptions<
    { status: 405; data: AddPetStatus405; statusText: string } | { status: number; data: AddPetStatusDefault; statusText: string },
    ResponseErrorConfig<AddPetStatus405>,
    AddPetRequestConfig,
    TContext
  >({
    mutationKey,
    mutationFn: async ({ body }) => {
      return addPet({ body }, config)
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
      { status: 405; data: AddPetStatus405; statusText: string } | { status: number; data: AddPetStatusDefault; statusText: string },
      ResponseErrorConfig<AddPetStatus405>,
      AddPetRequestConfig,
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<AddPetData>> & {
      client?: Client
      contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
    }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addPetMutationKey()

  const baseOptions = addPetMutationOptions(config) as UseMutationOptions<
    { status: 405; data: AddPetStatus405; statusText: string } | { status: number; data: AddPetStatusDefault; statusText: string },
    ResponseErrorConfig<AddPetStatus405>,
    AddPetRequestConfig,
    TContext
  >

  return useMutation<
    { status: 405; data: AddPetStatus405; statusText: string } | { status: number; data: AddPetStatusDefault; statusText: string },
    ResponseErrorConfig<AddPetStatus405>,
    AddPetRequestConfig,
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    { status: 405; data: AddPetStatus405; statusText: string } | { status: number; data: AddPetStatusDefault; statusText: string },
    ResponseErrorConfig<AddPetStatus405>,
    AddPetRequestConfig,
    TContext
  >
}
