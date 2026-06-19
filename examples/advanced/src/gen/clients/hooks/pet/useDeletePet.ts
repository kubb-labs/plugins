import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeletePetRequestConfig, DeletePetStatus400 } from '../../../models/ts/pet/DeletePet.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { deletePet } from '../../axios/petService/deletePet.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const deletePetMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export function deletePetMutationOptions<TContext = unknown>(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const mutationKey = deletePetMutationKey()
  return mutationOptions<
    { status: 400; data: DeletePetStatus400; statusText: string },
    ResponseErrorConfig<DeletePetStatus400>,
    Omit<DeletePetRequestConfig, 'url'>,
    TContext
  >({
    mutationKey,
    mutationFn: async ({ path, headers }) => {
      return deletePet({ path, headers }, config)
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
      { status: 400; data: DeletePetStatus400; statusText: string },
      ResponseErrorConfig<DeletePetStatus400>,
      Omit<DeletePetRequestConfig, 'url'>,
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? deletePetMutationKey()

  const baseOptions = deletePetMutationOptions(config) as UseMutationOptions<
    { status: 400; data: DeletePetStatus400; statusText: string },
    ResponseErrorConfig<DeletePetStatus400>,
    Omit<DeletePetRequestConfig, 'url'>,
    TContext
  >

  return useMutation<
    { status: 400; data: DeletePetStatus400; statusText: string },
    ResponseErrorConfig<DeletePetStatus400>,
    Omit<DeletePetRequestConfig, 'url'>,
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    { status: 400; data: DeletePetStatus400; statusText: string },
    ResponseErrorConfig<DeletePetStatus400>,
    Omit<DeletePetRequestConfig, 'url'>,
    TContext
  >
}
