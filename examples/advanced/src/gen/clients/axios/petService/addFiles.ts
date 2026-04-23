import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddFilesResponse, AddFilesStatus405 } from '../../../models/ts/petController/AddFiles.ts'

export function getAddFilesUrl() {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pet/files` as const }

  return res
}

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export async function addFiles({ data }: { data: AddFilesData }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<AddFilesResponse, ResponseErrorConfig<AddFilesStatus405>, unknown>({
    method: 'POST',
    url: getAddFilesUrl().url.toString(),
    ...requestConfig,
  })

  return res
}
