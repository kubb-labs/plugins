import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { CreatePetsXEXAMPLEEnumKey } from '../../../models/ts/CreatePetsXEXAMPLEEnum'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createPets } from '../../axios/petsService/createPets'
import { mutationOptions, useMutation } from '@tanstack/react-query'

type CreatePetsOptions = {
  body: {
    name: string
    tag: string
  }
  path: {
    uuid: string
  }
  query?: {
    bool_param?: true
    offset?: number
  }
  headers: {
    'X-EXAMPLE': CreatePetsXEXAMPLEEnumKey
  }
}

export const createPetsMutationKey = () => [{ url: '/pets/:uuid' }] as const

export function createPetsMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>> = {},
) {
  const mutationKey = createPetsMutationKey()
  return mutationOptions<unknown, ResponseErrorConfig<Error>, CreatePetsOptions, TContext>({
    mutationKey,
    mutationFn: async ({ path, query, body, headers }) => {
      return createPets({ ...config, path, query, body, headers, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `POST /pets/{uuid}`
 * @summary Create a pet
 */
export function useCreatePets<TContext>(
  options: {
    mutation?: UseMutationOptions<unknown, ResponseErrorConfig<Error>, CreatePetsOptions, TContext> & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createPetsMutationKey()

  const baseOptions = createPetsMutationOptions(config) as UseMutationOptions<unknown, ResponseErrorConfig<Error>, CreatePetsOptions, TContext>

  return useMutation<unknown, ResponseErrorConfig<Error>, CreatePetsOptions, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<unknown, ResponseErrorConfig<Error>, CreatePetsOptions, TContext>
}
