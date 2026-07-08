import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.ts'
import type { CreatePetsOptions, CreatePetsStatus201 } from '../../../models/ts/pets/CreatePets.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createPets } from '../../axios/petsService/createPets.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createPetsMutationKey = () => [{ url: '/pets/:uuid' }] as const

export function createPetsMutationOptions<TContext = unknown>(config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> = {}) {
  const mutationKey = createPetsMutationKey()
  return mutationOptions<CreatePetsStatus201, ResponseErrorConfig<Error>, CreatePetsOptions, TContext>({
    mutationKey,
    mutationFn: async ({ path, query, body, headers }) => {
      const { data } = await createPets({ ...config, path, query, body, headers, throwOnError: true })
      return data
    },
  })
}

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export function useCreatePets<TContext>(
  options: {
    mutation?: UseMutationOptions<CreatePetsStatus201, ResponseErrorConfig<Error>, CreatePetsOptions, TContext> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createPetsMutationKey()

  const baseOptions = createPetsMutationOptions(config) as UseMutationOptions<CreatePetsStatus201, ResponseErrorConfig<Error>, CreatePetsOptions, TContext>

  return useMutation<CreatePetsStatus201, ResponseErrorConfig<Error>, CreatePetsOptions, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<CreatePetsStatus201, ResponseErrorConfig<Error>, CreatePetsOptions, TContext>
}
