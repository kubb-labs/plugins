import type { Options, ResponseErrorConfig } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updatePet } from '../../axios/petService/updatePet'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updatePetMutationKey = () => [{ url: '/pet' }] as const

export function updatePetMutationOptions<TContext = unknown>(
  config: Omit<
    Options<
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType?:
            | 'application/json'
            | {
                request: 'application/json'
              }
        }
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType:
            | 'application/xml'
            | {
                request: 'application/xml'
              }
        }
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType:
            | 'application/x-www-form-urlencoded'
            | {
                request: 'application/x-www-form-urlencoded'
              }
        }
    >,
    'path' | 'query' | 'body' | 'headers' | 'cookies' | 'contentType' | 'throwOnError'
  > = {},
) {
  const mutationKey = updatePetMutationKey()
  return mutationOptions<
    | (Omit<NonNullable<Pet>, 'name'> | string)
    | {
        id?: number
      },
    ResponseErrorConfig<unknown | unknown | unknown>,
    (
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType?:
            | 'application/json'
            | {
                request: 'application/json'
              }
        }
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType:
            | 'application/xml'
            | {
                request: 'application/xml'
              }
        }
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType:
            | 'application/x-www-form-urlencoded'
            | {
                request: 'application/x-www-form-urlencoded'
              }
        }
    ) & { contentType?: string | { response?: 'application/json' | 'application/xml' } },
    TContext
  >({
    mutationKey,
    mutationFn: async (variables) => {
      return updatePet({ ...config, ...variables, throwOnError: true }).unwrap()
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
      | (Omit<NonNullable<Pet>, 'name'> | string)
      | {
          id?: number
        },
      ResponseErrorConfig<unknown | unknown | unknown>,
      (
        | {
            body: Omit<NonNullable<Pet>, 'id'>
            path?: never
            query?: never
            headers?: never
            contentType?:
              | 'application/json'
              | {
                  request: 'application/json'
                }
          }
        | {
            body: Omit<NonNullable<Pet>, 'id'>
            path?: never
            query?: never
            headers?: never
            contentType:
              | 'application/xml'
              | {
                  request: 'application/xml'
                }
          }
        | {
            body: Omit<NonNullable<Pet>, 'id'>
            path?: never
            query?: never
            headers?: never
            contentType:
              | 'application/x-www-form-urlencoded'
              | {
                  request: 'application/x-www-form-urlencoded'
                }
          }
      ) & { contentType?: string | { response?: 'application/json' | 'application/xml' } },
      TContext
    > & { client?: QueryClient }
    client?: Omit<
      Options<
        | {
            body: Omit<NonNullable<Pet>, 'id'>
            path?: never
            query?: never
            headers?: never
            contentType?:
              | 'application/json'
              | {
                  request: 'application/json'
                }
          }
        | {
            body: Omit<NonNullable<Pet>, 'id'>
            path?: never
            query?: never
            headers?: never
            contentType:
              | 'application/xml'
              | {
                  request: 'application/xml'
                }
          }
        | {
            body: Omit<NonNullable<Pet>, 'id'>
            path?: never
            query?: never
            headers?: never
            contentType:
              | 'application/x-www-form-urlencoded'
              | {
                  request: 'application/x-www-form-urlencoded'
                }
          }
      >,
      'path' | 'query' | 'body' | 'headers' | 'cookies' | 'contentType' | 'throwOnError'
    >
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updatePetMutationKey()

  const baseOptions = updatePetMutationOptions(config) as UseMutationOptions<
    | (Omit<NonNullable<Pet>, 'name'> | string)
    | {
        id?: number
      },
    ResponseErrorConfig<unknown | unknown | unknown>,
    (
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType?:
            | 'application/json'
            | {
                request: 'application/json'
              }
        }
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType:
            | 'application/xml'
            | {
                request: 'application/xml'
              }
        }
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType:
            | 'application/x-www-form-urlencoded'
            | {
                request: 'application/x-www-form-urlencoded'
              }
        }
    ) & { contentType?: string | { response?: 'application/json' | 'application/xml' } },
    TContext
  >

  return useMutation<
    | (Omit<NonNullable<Pet>, 'name'> | string)
    | {
        id?: number
      },
    ResponseErrorConfig<unknown | unknown | unknown>,
    (
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType?:
            | 'application/json'
            | {
                request: 'application/json'
              }
        }
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType:
            | 'application/xml'
            | {
                request: 'application/xml'
              }
        }
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType:
            | 'application/x-www-form-urlencoded'
            | {
                request: 'application/x-www-form-urlencoded'
              }
        }
    ) & { contentType?: string | { response?: 'application/json' | 'application/xml' } },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    | (Omit<NonNullable<Pet>, 'name'> | string)
    | {
        id?: number
      },
    ResponseErrorConfig<unknown | unknown | unknown>,
    (
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType?:
            | 'application/json'
            | {
                request: 'application/json'
              }
        }
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType:
            | 'application/xml'
            | {
                request: 'application/xml'
              }
        }
      | {
          body: Omit<NonNullable<Pet>, 'id'>
          path?: never
          query?: never
          headers?: never
          contentType:
            | 'application/x-www-form-urlencoded'
            | {
                request: 'application/x-www-form-urlencoded'
              }
        }
    ) & { contentType?: string | { response?: 'application/json' | 'application/xml' } },
    TContext
  >
}
