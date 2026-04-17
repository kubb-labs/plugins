import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { AddPetData, AddPetResponse, AddPetStatus405 } from '../../../models/ts/petController/AddPet.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addPet } from '../../axios/petService/addPet.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export type AddPetMutationKey = ReturnType<typeof addPetMutationKey>

export function addPetMutationOptions<TContext = unknown>(config: Partial<RequestConfig<AddPetData>> & { client?: Client } = {}) {
  const mutationKey = addPetMutationKey()
  return mutationOptions<ResponseConfig<AddPetResponse>, ResponseErrorConfig<AddPetStatus405>, { data: AddPetData }, TContext>({
    mutationKey,
    mutationFn: async ({ data }) => {
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
    mutation?: UseMutationOptions<ResponseConfig<AddPetResponse>, ResponseErrorConfig<AddPetStatus405>, { data: AddPetData }, TContext> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig<AddPetData>> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addPetMutationKey()

  const baseOptions = addPetMutationOptions(config) as UseMutationOptions<
    ResponseConfig<AddPetResponse>,
    ResponseErrorConfig<AddPetStatus405>,
    { data: AddPetData },
    TContext
  >

  return useMutation<ResponseConfig<AddPetResponse>, ResponseErrorConfig<AddPetStatus405>, { data: AddPetData }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<AddPetResponse>, ResponseErrorConfig<AddPetStatus405>, { data: AddPetData }, TContext>
}
