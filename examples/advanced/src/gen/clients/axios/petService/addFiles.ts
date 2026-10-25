import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap } from '../../../.kubb/client'

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export function addFiles<ThrowOnError extends boolean = true>(
  options: Options<
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
    ThrowOnError
  >,
): Unwrappable<
  RequestResult<
    {
      '200': Omit<NonNullable<Pet>, 'name'>
      '405': unknown
    },
    ThrowOnError
  >
> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request<
      (
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
          }
      )['body']
    >({ method: 'POST', url: '/pet/files', ...config, throwOnError: config.throwOnError ?? true }) as Promise<
      RequestResult<
        {
          '200': Omit<NonNullable<Pet>, 'name'>
          '405': unknown
        },
        ThrowOnError
      >
    >,
  )
}
