import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UpdatePetWithFormRequestConfig, UpdatePetWithFormStatus405 } from '../../../models/ts/pet/UpdatePetWithForm.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updatePetWithForm } from '../../axios/petService/updatePetWithForm.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updatePetWithFormMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export function updatePetWithFormMutationOptions<TContext = unknown>(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const mutationKey = updatePetWithFormMutationKey()
  return mutationOptions<
    { status: 405; data: UpdatePetWithFormStatus405; statusText: string },
    ResponseErrorConfig<UpdatePetWithFormStatus405>,
    UpdatePetWithFormRequestConfig,
    TContext
  >({
    mutationKey,
    mutationFn: async ({ path, query }) => {
      return updatePetWithForm({ path, query }, config)
    },
  })
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export function useUpdatePetWithForm<TContext>(
  options: {
    mutation?: UseMutationOptions<
      { status: 405; data: UpdatePetWithFormStatus405; statusText: string },
      ResponseErrorConfig<UpdatePetWithFormStatus405>,
      UpdatePetWithFormRequestConfig,
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updatePetWithFormMutationKey()

  const baseOptions = updatePetWithFormMutationOptions(config) as UseMutationOptions<
    { status: 405; data: UpdatePetWithFormStatus405; statusText: string },
    ResponseErrorConfig<UpdatePetWithFormStatus405>,
    UpdatePetWithFormRequestConfig,
    TContext
  >

  return useMutation<
    { status: 405; data: UpdatePetWithFormStatus405; statusText: string },
    ResponseErrorConfig<UpdatePetWithFormStatus405>,
    UpdatePetWithFormRequestConfig,
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    { status: 405; data: UpdatePetWithFormStatus405; statusText: string },
    ResponseErrorConfig<UpdatePetWithFormStatus405>,
    UpdatePetWithFormRequestConfig,
    TContext
  >
}
