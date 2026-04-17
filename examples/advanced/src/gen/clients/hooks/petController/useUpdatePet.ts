import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetData,
  UpdatePetResponse,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../../models/ts/petController/UpdatePet.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updatePet } from '../../axios/petService/updatePet.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updatePetMutationKey = () => [{ url: '/pet' }] as const

export type UpdatePetMutationKey = ReturnType<typeof updatePetMutationKey>

export function updatePetMutationOptions<TContext = unknown>(config: Partial<RequestConfig<UpdatePetData>> & { client?: Client } = {}) {
  const mutationKey = updatePetMutationKey()
  return mutationOptions<
    ResponseConfig<UpdatePetResponse>,
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    { data: UpdatePetData },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ data }) => {
      return updatePet({ data }, config)
    },
  })
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export function useUpdatePet<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<UpdatePetResponse>,
      ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
      { data: UpdatePetData },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UpdatePetData>> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updatePetMutationKey()

  const baseOptions = updatePetMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UpdatePetResponse>,
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    { data: UpdatePetData },
    TContext
  >

  return useMutation<
    ResponseConfig<UpdatePetResponse>,
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    { data: UpdatePetData },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UpdatePetResponse>,
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    { data: UpdatePetData },
    TContext
  >
}
