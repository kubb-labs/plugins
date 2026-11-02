import type { RequestConfig, ResponseErrorConfig, RequestResult } from '../../../.kubb/client'
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
    RequestResult<
      {
        '200':
          | {
              contentType: 'application/json'
              data: Omit<NonNullable<Pet>, 'name'>
            }
          | {
              contentType: 'application/xml'
              data: Omit<NonNullable<Pet>, 'name'>
            }
        '202': {
          id?: number
        }
        '400': unknown
        '404': unknown
        '405': unknown
      },
      true
    >,
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
      return await updatePet({ ...config, ...variables, throwOnError: true } as Parameters<typeof updatePet<true>>[0])
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
      RequestResult<
        {
          '200':
            | {
                contentType: 'application/json'
                data: Omit<NonNullable<Pet>, 'name'>
              }
            | {
                contentType: 'application/xml'
                data: Omit<NonNullable<Pet>, 'name'>
              }
          '202': {
            id?: number
          }
          '400': unknown
          '404': unknown
          '405': unknown
        },
        true
      >,
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
    RequestResult<
      {
        '200':
          | {
              contentType: 'application/json'
              data: Omit<NonNullable<Pet>, 'name'>
            }
          | {
              contentType: 'application/xml'
              data: Omit<NonNullable<Pet>, 'name'>
            }
        '202': {
          id?: number
        }
        '400': unknown
        '404': unknown
        '405': unknown
      },
      true
    >,
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
    RequestResult<
      {
        '200':
          | {
              contentType: 'application/json'
              data: Omit<NonNullable<Pet>, 'name'>
            }
          | {
              contentType: 'application/xml'
              data: Omit<NonNullable<Pet>, 'name'>
            }
        '202': {
          id?: number
        }
        '400': unknown
        '404': unknown
        '405': unknown
      },
      true
    >,
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
    RequestResult<
      {
        '200':
          | {
              contentType: 'application/json'
              data: Omit<NonNullable<Pet>, 'name'>
            }
          | {
              contentType: 'application/xml'
              data: Omit<NonNullable<Pet>, 'name'>
            }
        '202': {
          id?: number
        }
        '400': unknown
        '404': unknown
        '405': unknown
      },
      true
    >,
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
