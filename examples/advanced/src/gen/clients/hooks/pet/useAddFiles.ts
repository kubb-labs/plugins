import type { RequestConfig, ResponseErrorConfig, RequestResult } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addFiles } from '../../axios/petService/addFiles'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addFilesMutationKey = () => [{ url: '/pet/files' }] as const

export function addFilesMutationOptions<TContext = unknown>(
  config: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & {
    contentType?: { request?: 'application/json' | 'multipart/form-data' }
  } = {},
) {
  const mutationKey = addFilesMutationKey()
  return mutationOptions<
    RequestResult<
      {
        '200': Omit<NonNullable<Pet>, 'name'>
        '405': unknown
      },
      true
    >,
    ResponseErrorConfig<unknown>,
    | {
        body: {
          url: string
        }
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
          request: 'multipart/form-data'
        }
      },
    TContext
  >({
    mutationKey,
    mutationFn: async (variables) => {
      return await addFiles({ ...config, ...variables, throwOnError: true } as Parameters<typeof addFiles<true>>[0])
    },
  })
}

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export function useAddFiles<TContext>(
  options: {
    mutation?: UseMutationOptions<
      RequestResult<
        {
          '200': Omit<NonNullable<Pet>, 'name'>
          '405': unknown
        },
        true
      >,
      ResponseErrorConfig<unknown>,
      | {
          body: {
            url: string
          }
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
            request: 'multipart/form-data'
          }
        },
      TContext
    > & { client?: QueryClient }
    client?: Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & {
      contentType?: { request?: 'application/json' | 'multipart/form-data' }
    }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addFilesMutationKey()

  const baseOptions = addFilesMutationOptions(config) as UseMutationOptions<
    RequestResult<
      {
        '200': Omit<NonNullable<Pet>, 'name'>
        '405': unknown
      },
      true
    >,
    ResponseErrorConfig<unknown>,
    | {
        body: {
          url: string
        }
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
          request: 'multipart/form-data'
        }
      },
    TContext
  >

  return useMutation<
    RequestResult<
      {
        '200': Omit<NonNullable<Pet>, 'name'>
        '405': unknown
      },
      true
    >,
    ResponseErrorConfig<unknown>,
    | {
        body: {
          url: string
        }
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
    RequestResult<
      {
        '200': Omit<NonNullable<Pet>, 'name'>
        '405': unknown
      },
      true
    >,
    ResponseErrorConfig<unknown>,
    | {
        body: {
          url: string
        }
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
          request: 'multipart/form-data'
        }
      },
    TContext
  >
}
