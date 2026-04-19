import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { DeletePetResponse, DeletePetPathPetId, DeletePetHeaderApiKey, DeletePetStatus400 } from '../../../models/ts/petController/DeletePet.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { deletePet } from '../../axios/petService/deletePet.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const deletePetMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export function deletePetMutationOptions<TContext = unknown>(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const mutationKey = deletePetMutationKey()
  return mutationOptions<
    ResponseConfig<DeletePetResponse>,
    ResponseErrorConfig<DeletePetStatus400>,
    { petId: DeletePetPathPetId; headers?: { apiKey?: DeletePetHeaderApiKey } },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ petId, headers }) => {
      return deletePet({ petId, headers }, config)
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
      ResponseConfig<DeletePetResponse>,
      ResponseErrorConfig<DeletePetStatus400>,
      { petId: DeletePetPathPetId; headers?: { apiKey?: DeletePetHeaderApiKey } },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? deletePetMutationKey()

  const baseOptions = deletePetMutationOptions(config) as UseMutationOptions<
    ResponseConfig<DeletePetResponse>,
    ResponseErrorConfig<DeletePetStatus400>,
    { petId: DeletePetPathPetId; headers?: { apiKey?: DeletePetHeaderApiKey } },
    TContext
  >

  return useMutation<
    ResponseConfig<DeletePetResponse>,
    ResponseErrorConfig<DeletePetStatus400>,
    { petId: DeletePetPathPetId; headers?: { apiKey?: DeletePetHeaderApiKey } },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<DeletePetResponse>,
    ResponseErrorConfig<DeletePetStatus400>,
    { petId: DeletePetPathPetId; headers?: { apiKey?: DeletePetHeaderApiKey } },
    TContext
  >
}
