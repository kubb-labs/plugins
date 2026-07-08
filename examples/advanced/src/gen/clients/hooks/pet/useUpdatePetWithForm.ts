import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.ts'
import type { UpdatePetWithFormOptions, UpdatePetWithFormResponse, UpdatePetWithFormStatus405 } from '../../../models/ts/pet/UpdatePetWithForm.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updatePetWithForm } from '../../axios/petService/updatePetWithForm.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updatePetWithFormMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export function updatePetWithFormMutationOptions<TContext = unknown>(config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> = {}) {
  const mutationKey = updatePetWithFormMutationKey()
  return mutationOptions<UpdatePetWithFormResponse, ResponseErrorConfig<UpdatePetWithFormStatus405>, UpdatePetWithFormOptions, TContext>({
    mutationKey,
    mutationFn: async ({ path, query }) => {
      const { data } = await updatePetWithForm({ ...config, path, query, throwOnError: true })
      return data
    },
  })
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export function useUpdatePetWithForm<TContext>(
  options: {
    mutation?: UseMutationOptions<UpdatePetWithFormResponse, ResponseErrorConfig<UpdatePetWithFormStatus405>, UpdatePetWithFormOptions, TContext> & {
      client?: QueryClient
    }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updatePetWithFormMutationKey()

  const baseOptions = updatePetWithFormMutationOptions(config) as UseMutationOptions<
    UpdatePetWithFormResponse,
    ResponseErrorConfig<UpdatePetWithFormStatus405>,
    UpdatePetWithFormOptions,
    TContext
  >

  return useMutation<UpdatePetWithFormResponse, ResponseErrorConfig<UpdatePetWithFormStatus405>, UpdatePetWithFormOptions, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<UpdatePetWithFormResponse, ResponseErrorConfig<UpdatePetWithFormStatus405>, UpdatePetWithFormOptions, TContext>
}
