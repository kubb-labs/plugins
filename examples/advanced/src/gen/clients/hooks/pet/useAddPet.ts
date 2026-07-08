import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.ts'
import type { AddPetOptions, AddPetResponse, AddPetStatus405 } from '../../../models/ts/pet/AddPet.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addPet } from '../../axios/petService/addPet.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export function addPetMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & {
    contentType?: { request?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded' }
  } = {},
) {
  const mutationKey = addPetMutationKey()
  return mutationOptions<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, AddPetOptions, TContext>({
    mutationKey,
    mutationFn: async ({ body }) => {
      const { data } = await addPet({ ...config, body, throwOnError: true })
      return data
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
    mutation?: UseMutationOptions<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, AddPetOptions, TContext> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & {
      contentType?: { request?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded' }
    }
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
