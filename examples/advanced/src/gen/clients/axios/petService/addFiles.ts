import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { AddFilesOptions, AddFilesResponses } from '../../../models/ts/pet/AddFiles'
import { client, withUnwrap } from '../../../.kubb/client'

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export function addFiles<ThrowOnError extends boolean = true>(
  options: Options<AddFilesOptions, ThrowOnError>,
): Unwrappable<RequestResult<AddFilesResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(request({ method: 'POST', url: '/pet/files', ...config }) as Promise<RequestResult<AddFilesResponses, ThrowOnError>>)
}
