import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'

/**
 * `POST /pet/files`
 * @description Place a new file in the store
 * @summary Place an file for a pet
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
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<
      {
        '200': Omit<NonNullable<Pet>, 'name'>
        '405': unknown
      },
      ThrowOnError
    >({
      method: 'POST',
      url: '/pet/files',
      contentType: { request: 'application/json' },
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
