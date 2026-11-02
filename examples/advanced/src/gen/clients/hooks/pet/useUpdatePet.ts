import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
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
    | Omit<NonNullable<Pet>, 'name'>
    | {
        id?: number
      },
    ResponseErrorConfig<unknown | unknown | unknown>,
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType?: {
          request: 'application/json'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/xml'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/x-www-form-urlencoded'
        }
      },
    TContext
  >({
    mutationKey,
    mutationFn: async (variables) => {
      return updatePet({ ...config, ...variables, throwOnError: true } as Parameters<typeof updatePet<true>>[0]).unwrap()
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
      | Omit<NonNullable<Pet>, 'name'>
      | {
          id?: number
        },
      ResponseErrorConfig<unknown | unknown | unknown>,
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType?: {
            request: 'application/json'
          }
        }
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType: {
            request: 'application/xml'
          }
        }
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType: {
            request: 'application/x-www-form-urlencoded'
          }
        },
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
    | Omit<NonNullable<Pet>, 'name'>
    | {
        id?: number
      },
    ResponseErrorConfig<unknown | unknown | unknown>,
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType?: {
          request: 'application/json'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/xml'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/x-www-form-urlencoded'
        }
      },
    TContext
  >

  return useMutation<
    | Omit<NonNullable<Pet>, 'name'>
    | {
        id?: number
      },
    ResponseErrorConfig<unknown | unknown | unknown>,
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType?: {
          request: 'application/json'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/xml'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/x-www-form-urlencoded'
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
    | Omit<NonNullable<Pet>, 'name'>
    | {
        id?: number
      },
    ResponseErrorConfig<unknown | unknown | unknown>,
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType?: {
          request: 'application/json'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/xml'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/x-www-form-urlencoded'
        }
      },
    TContext
  >
}
