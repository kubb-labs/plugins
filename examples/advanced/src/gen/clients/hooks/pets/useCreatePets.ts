import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreatePetsRequestConfig, CreatePetsData, CreatePetsStatus201, CreatePetsStatusDefault } from '../../../models/ts/pets/CreatePets.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createPets } from '../../axios/petsService/createPets.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createPetsMutationKey = () => [{ url: '/pets/:uuid' }] as const

export function createPetsMutationOptions<TContext = unknown>(config: Partial<RequestConfig<CreatePetsData>> & { client?: Client } = {}) {
  const mutationKey = createPetsMutationKey()
  return mutationOptions<
    { status: 201; data: CreatePetsStatus201; statusText: string } | { status: number; data: CreatePetsStatusDefault; statusText: string },
    ResponseErrorConfig<Error>,
    Omit<CreatePetsRequestConfig, 'url'>,
    TContext
  >({
    mutationKey,
    mutationFn: async ({ path, query, body, headers }) => {
      return createPets({ path, query, body, headers }, config)
    },
  })
}

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export function useCreatePets<TContext>(
  options: {
    mutation?: UseMutationOptions<
      { status: 201; data: CreatePetsStatus201; statusText: string } | { status: number; data: CreatePetsStatusDefault; statusText: string },
      ResponseErrorConfig<Error>,
      Omit<CreatePetsRequestConfig, 'url'>,
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<CreatePetsData>> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createPetsMutationKey()

  const baseOptions = createPetsMutationOptions(config) as UseMutationOptions<
    { status: 201; data: CreatePetsStatus201; statusText: string } | { status: number; data: CreatePetsStatusDefault; statusText: string },
    ResponseErrorConfig<Error>,
    Omit<CreatePetsRequestConfig, 'url'>,
    TContext
  >

  return useMutation<
    { status: 201; data: CreatePetsStatus201; statusText: string } | { status: number; data: CreatePetsStatusDefault; statusText: string },
    ResponseErrorConfig<Error>,
    Omit<CreatePetsRequestConfig, 'url'>,
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    { status: 201; data: CreatePetsStatus201; statusText: string } | { status: number; data: CreatePetsStatusDefault; statusText: string },
    ResponseErrorConfig<Error>,
    Omit<CreatePetsRequestConfig, 'url'>,
    TContext
  >
}
