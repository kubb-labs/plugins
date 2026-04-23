import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormResponse,
  UpdatePetWithFormPathPetId,
  UpdatePetWithFormQueryName,
  UpdatePetWithFormQueryStatus,
  UpdatePetWithFormStatus405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updatePetWithForm } from '../../axios/petService/updatePetWithForm.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updatePetWithFormMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export function updatePetWithFormMutationOptions<TContext = unknown>(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const mutationKey = updatePetWithFormMutationKey()
  return mutationOptions<
    ResponseConfig<UpdatePetWithFormResponse>,
    ResponseErrorConfig<UpdatePetWithFormStatus405>,
    { petId: UpdatePetWithFormPathPetId; params?: { name?: UpdatePetWithFormQueryName; status?: UpdatePetWithFormQueryStatus } },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ petId, params }) => {
      return updatePetWithForm({ petId, params }, config)
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
      ResponseConfig<UpdatePetWithFormResponse>,
      ResponseErrorConfig<UpdatePetWithFormStatus405>,
      { petId: UpdatePetWithFormPathPetId; params?: { name?: UpdatePetWithFormQueryName; status?: UpdatePetWithFormQueryStatus } },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updatePetWithFormMutationKey()

  const baseOptions = updatePetWithFormMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UpdatePetWithFormResponse>,
    ResponseErrorConfig<UpdatePetWithFormStatus405>,
    { petId: UpdatePetWithFormPathPetId; params?: { name?: UpdatePetWithFormQueryName; status?: UpdatePetWithFormQueryStatus } },
    TContext
  >

  return useMutation<
    ResponseConfig<UpdatePetWithFormResponse>,
    ResponseErrorConfig<UpdatePetWithFormStatus405>,
    { petId: UpdatePetWithFormPathPetId; params?: { name?: UpdatePetWithFormQueryName; status?: UpdatePetWithFormQueryStatus } },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UpdatePetWithFormResponse>,
    ResponseErrorConfig<UpdatePetWithFormStatus405>,
    { petId: UpdatePetWithFormPathPetId; params?: { name?: UpdatePetWithFormQueryName; status?: UpdatePetWithFormQueryStatus } },
    TContext
  >
}
