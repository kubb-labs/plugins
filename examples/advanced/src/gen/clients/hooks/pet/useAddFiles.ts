import type { RequestConfig, ResponseErrorConfig } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addFiles } from '../../axios/petService/addFiles'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addFilesMutationKey = () => [{ url: '/pet/files' }] as const

export function addFilesMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'contentType' | 'throwOnError'>> = {},
) {
  const mutationKey = addFilesMutationKey()
  return mutationOptions<
    Omit<NonNullable<Pet>, 'name'>,
    ResponseErrorConfig<unknown>,
    | {
        body: {
          url: string
        }
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
          | 'multipart/form-data'
          | {
              request: 'multipart/form-data'
            }
      },
    TContext
  >({
    mutationKey,
    mutationFn: async (variables) => {
      return addFiles({ ...config, ...variables, throwOnError: true }).unwrap()
    },
  })
}

/**
 * `POST /pet/files`
 * @description Place a new file in the store
 * @summary Place an file for a pet
 */
export function useAddFiles<TContext>(
  options: {
    mutation?: UseMutationOptions<
      Omit<NonNullable<Pet>, 'name'>,
      ResponseErrorConfig<unknown>,
      | {
          body: {
            url: string
          }
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
            | 'multipart/form-data'
            | {
                request: 'multipart/form-data'
              }
        },
      TContext
    > & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'contentType' | 'throwOnError'>>
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addFilesMutationKey()

  const baseOptions = addFilesMutationOptions(config) as UseMutationOptions<
    Omit<NonNullable<Pet>, 'name'>,
    ResponseErrorConfig<unknown>,
    | {
        body: {
          url: string
        }
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
          | 'multipart/form-data'
          | {
              request: 'multipart/form-data'
            }
      },
    TContext
  >

  return useMutation<
    Omit<NonNullable<Pet>, 'name'>,
    ResponseErrorConfig<unknown>,
    | {
        body: {
          url: string
        }
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
          | 'multipart/form-data'
          | {
              request: 'multipart/form-data'
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
    Omit<NonNullable<Pet>, 'name'>,
    ResponseErrorConfig<unknown>,
    | {
        body: {
          url: string
        }
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
          | 'multipart/form-data'
          | {
              request: 'multipart/form-data'
            }
      },
    TContext
  >
}
