import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddFilesRequestConfig, AddFilesData, AddFilesStatus200, AddFilesStatus405 } from '../../../models/ts/pet/AddFiles.ts'
import { buildFormData } from '../../../.kubb/config.ts'

export function getAddFilesUrl() {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pet/files` as const }

  return res
}

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export async function addFiles(
  { body }: Omit<AddFilesRequestConfig, 'url'>,
  config: Partial<RequestConfig<AddFilesData>> & { client?: Client; contentType?: 'application/json' | 'multipart/form-data' } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestData = body
  const formData = buildFormData(requestData)

  const res = await request<AddFilesStatus200 | AddFilesStatus405, ResponseErrorConfig<AddFilesStatus405>, AddFilesData>({
    method: 'POST',
    url: getAddFilesUrl().url.toString(),
    body: contentType === 'multipart/form-data' ? (formData as FormData) : requestData,
    contentType,
    ...requestConfig,
  })

  return res as { status: 200; data: AddFilesStatus200; statusText: string } | { status: 405; data: AddFilesStatus405; statusText: string }
}
