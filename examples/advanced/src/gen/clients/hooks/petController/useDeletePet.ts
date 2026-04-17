import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeletePetHeaderApiKey, DeletePetPathPetId, DeletePetResponse, DeletePetStatus400 } from '../../../models/ts/petController/DeletePet.ts'
import { deletePet } from '../../axios/petService/deletePet.ts'

export const deletePetMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export type DeletePetMutationKey = ReturnType<typeof deletePetMutationKey>

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
