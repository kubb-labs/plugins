import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { AddPetResponse, AddPetStatus405 } from '../../../models/ts/petController/AddPet.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addPet } from '../../axios/petService/addPet.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export function addPetMutationOptions<TContext = unknown>(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const mutationKey = addPetMutationKey()
  return mutationOptions<ResponseConfig<AddPetResponse>, ResponseErrorConfig<AddPetStatus405>, void, TContext>({
    mutationKey,
    mutationFn: async (_) => {
      return addPet({ data }, config)
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
    mutation?: UseMutationOptions<ResponseConfig<AddPetResponse>, ResponseErrorConfig<AddPetStatus405>, void, TContext> & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addPetMutationKey()

  const baseOptions = addPetMutationOptions(config) as UseMutationOptions<ResponseConfig<AddPetResponse>, ResponseErrorConfig<AddPetStatus405>, void, TContext>

  return useMutation<ResponseConfig<AddPetResponse>, ResponseErrorConfig<AddPetStatus405>, void, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<AddPetResponse>, ResponseErrorConfig<AddPetStatus405>, void, TContext>
}
