import type { RequestConfig, ResponseErrorConfig, RequestResult } from '../../../.kubb/client'
import type { CreatePetsBoolParamKey } from '../../../models/ts/CreatePetsBoolParam'
import type { CreatePetsXEXAMPLEKey } from '../../../models/ts/CreatePetsXEXAMPLE'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createPets } from '../../axios/petsService/createPets'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createPetsMutationKey = () => [{ url: '/pets/:uuid' }] as const

export function createPetsMutationOptions<TContext = unknown>(config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> = {}) {
  const mutationKey = createPetsMutationKey()
  return mutationOptions<
    RequestResult<
      {
        '201': unknown
        default: unknown
      },
      true
    >,
    ResponseErrorConfig<Error>,
    {
      body: {
        name: string
        tag: string
      }
      path: {
        uuid: string
      }
      query?: {
        bool_param?: CreatePetsBoolParamKey
        offset?: number
      }
      headers: {
        'X-EXAMPLE': CreatePetsXEXAMPLEKey
      }
    },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ path, query, body, headers }) => {
      return await createPets({ ...config, path, query, body, headers, throwOnError: true })
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
      RequestResult<
        {
          '201': unknown
          default: unknown
        },
        true
      >,
      ResponseErrorConfig<Error>,
      {
        body: {
          name: string
          tag: string
        }
        path: {
          uuid: string
        }
        query?: {
          bool_param?: CreatePetsBoolParamKey
          offset?: number
        }
        headers: {
          'X-EXAMPLE': CreatePetsXEXAMPLEKey
        }
      },
      TContext
    > & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createPetsMutationKey()

  const baseOptions = createPetsMutationOptions(config) as UseMutationOptions<
    RequestResult<
      {
        '201': unknown
        default: unknown
      },
      true
    >,
    ResponseErrorConfig<Error>,
    {
      body: {
        name: string
        tag: string
      }
      path: {
        uuid: string
      }
      query?: {
        bool_param?: CreatePetsBoolParamKey
        offset?: number
      }
      headers: {
        'X-EXAMPLE': CreatePetsXEXAMPLEKey
      }
    },
    TContext
  >

  return useMutation<
    RequestResult<
      {
        '201': unknown
        default: unknown
      },
      true
    >,
    ResponseErrorConfig<Error>,
    {
      body: {
        name: string
        tag: string
      }
      path: {
        uuid: string
      }
      query?: {
        bool_param?: CreatePetsBoolParamKey
        offset?: number
      }
      headers: {
        'X-EXAMPLE': CreatePetsXEXAMPLEKey
      }
    },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    RequestResult<
      {
        '201': unknown
        default: unknown
      },
      true
    >,
    ResponseErrorConfig<Error>,
    {
      body: {
        name: string
        tag: string
      }
      path: {
        uuid: string
      }
      query?: {
        bool_param?: CreatePetsBoolParamKey
        offset?: number
      }
      headers: {
        'X-EXAMPLE': CreatePetsXEXAMPLEKey
      }
    },
    TContext
  >
}
