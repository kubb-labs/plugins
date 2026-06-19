import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetRequestConfig,
  UpdatePetData,
  UpdatePetStatus200,
  UpdatePetStatus202,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../../models/ts/pet/UpdatePet.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updatePet } from '../../axios/petService/updatePet.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updatePetMutationKey = () => [{ url: '/pet' }] as const

export function updatePetMutationOptions<TContext = unknown>(
  config: Partial<RequestConfig<UpdatePetData>> & {
    client?: Client
    contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
  } = {},
) {
  const mutationKey = updatePetMutationKey()
  return mutationOptions<
    | { status: 200; data: UpdatePetStatus200; statusText: string }
    | { status: 202; data: UpdatePetStatus202; statusText: string }
    | { status: 400; data: UpdatePetStatus400; statusText: string }
    | { status: 404; data: UpdatePetStatus404; statusText: string }
    | { status: 405; data: UpdatePetStatus405; statusText: string },
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    Omit<UpdatePetRequestConfig, 'url'>,
    TContext
  >({
    mutationKey,
    mutationFn: async ({ body }) => {
      return updatePet({ body }, config)
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
      | { status: 200; data: UpdatePetStatus200; statusText: string }
      | { status: 202; data: UpdatePetStatus202; statusText: string }
      | { status: 400; data: UpdatePetStatus400; statusText: string }
      | { status: 404; data: UpdatePetStatus404; statusText: string }
      | { status: 405; data: UpdatePetStatus405; statusText: string },
      ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
      Omit<UpdatePetRequestConfig, 'url'>,
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UpdatePetData>> & {
      client?: Client
      contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
    }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updatePetMutationKey()

  const baseOptions = updatePetMutationOptions(config) as UseMutationOptions<
    | { status: 200; data: UpdatePetStatus200; statusText: string }
    | { status: 202; data: UpdatePetStatus202; statusText: string }
    | { status: 400; data: UpdatePetStatus400; statusText: string }
    | { status: 404; data: UpdatePetStatus404; statusText: string }
    | { status: 405; data: UpdatePetStatus405; statusText: string },
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    Omit<UpdatePetRequestConfig, 'url'>,
    TContext
  >

  return useMutation<
    | { status: 200; data: UpdatePetStatus200; statusText: string }
    | { status: 202; data: UpdatePetStatus202; statusText: string }
    | { status: 400; data: UpdatePetStatus400; statusText: string }
    | { status: 404; data: UpdatePetStatus404; statusText: string }
    | { status: 405; data: UpdatePetStatus405; statusText: string },
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    Omit<UpdatePetRequestConfig, 'url'>,
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    | { status: 200; data: UpdatePetStatus200; statusText: string }
    | { status: 202; data: UpdatePetStatus202; statusText: string }
    | { status: 400; data: UpdatePetStatus400; statusText: string }
    | { status: 404; data: UpdatePetStatus404; statusText: string }
    | { status: 405; data: UpdatePetStatus405; statusText: string },
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    Omit<UpdatePetRequestConfig, 'url'>,
    TContext
  >
}
