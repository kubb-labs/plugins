import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { AddFilesOptions, AddFilesResponses } from '../../../models/ts/pet/AddFiles.ts'
import { client } from '../../../.kubb/client.ts'

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export function addFiles<ThrowOnError extends boolean = true>(
  options: Options<AddFilesOptions, ThrowOnError>,
): Promise<RequestResult<AddFilesResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'POST', url: '/pet/files', ...config }) as Promise<RequestResult<AddFilesResponses, ThrowOnError>>
}
