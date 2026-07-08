import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.ts'
import type { DeletePetOptions, DeletePetResponse, DeletePetStatus400 } from '../../../models/ts/pet/DeletePet.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { deletePet } from '../../axios/petService/deletePet.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const deletePetMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export function deletePetMutationOptions<TContext = unknown>(config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> = {}) {
  const mutationKey = deletePetMutationKey()
  return mutationOptions<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, DeletePetOptions, TContext>({
    mutationKey,
    mutationFn: async ({ path, headers }) => {
      const { data } = await deletePet({ ...config, path, headers, throwOnError: true })
      return data
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
    mutation?: UseMutationOptions<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, DeletePetOptions, TContext> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? deletePetMutationKey()

  const baseOptions = deletePetMutationOptions(config) as UseMutationOptions<
    DeletePetResponse,
    ResponseErrorConfig<DeletePetStatus400>,
    DeletePetOptions,
    TContext
  >

  return useMutation<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, DeletePetOptions, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, DeletePetOptions, TContext>
}
