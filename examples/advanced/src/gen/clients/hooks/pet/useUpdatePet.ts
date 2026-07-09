import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type {
  UpdatePetOptions,
  UpdatePetStatus200,
  UpdatePetStatus202,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../../models/ts/pet/UpdatePet'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updatePet } from '../../axios/petService/updatePet'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updatePetMutationKey = () => [{ url: '/pet' }] as const

export function updatePetMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & {
    contentType?: { request?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'; response?: 'application/json' | 'application/xml' }
  } = {},
) {
  const mutationKey = updatePetMutationKey()
  return mutationOptions<
    UpdatePetStatus200 | UpdatePetStatus202,
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    UpdatePetOptions,
    TContext
  >({
    mutationKey,
    mutationFn: async ({ body }) => {
      const { data } = await updatePet({ ...config, body, throwOnError: true })
      return data
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
      UpdatePetStatus200 | UpdatePetStatus202,
      ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
      UpdatePetOptions,
      TContext
    > & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & {
      contentType?: {
        request?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
        response?: 'application/json' | 'application/xml'
      }
    }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updatePetMutationKey()

  const baseOptions = updatePetMutationOptions(config) as UseMutationOptions<
    UpdatePetStatus200 | UpdatePetStatus202,
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    UpdatePetOptions,
    TContext
  >

  return useMutation<
    UpdatePetStatus200 | UpdatePetStatus202,
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    UpdatePetOptions,
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    UpdatePetStatus200 | UpdatePetStatus202,
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    UpdatePetOptions,
    TContext
  >
}
