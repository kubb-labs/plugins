import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { ApiResponse } from '../../../models/ts/ApiResponse'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'

/**
 * `POST /pet/{petId}/uploadImage`
 * @summary uploads an image
 * @param options - The request (`path`, `query`, `body`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The result with `data` or `error`, `status`, `request`, and `response`.
 */
export function uploadFile<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body: Blob
      path: {
        petId: number
      }
      query?: {
        additionalMetadata?: string
      }
      headers?: never
    },
    ThrowOnError
  >,
): Unwrappable<
  RequestResult<
    {
      '200': ApiResponse
    },
    ThrowOnError
  >
> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<
      {
        '200': ApiResponse
      },
      ThrowOnError
    >({
      method: 'POST',
      url: '/pet/{petId}/uploadImage',
      security: [{ type: 'oauth2', scopes: ['write:pets', 'read:pets'] }],
      contentType: { request: 'application/octet-stream' },
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
