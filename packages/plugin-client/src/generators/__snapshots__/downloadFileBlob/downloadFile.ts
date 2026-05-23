/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { DownloadFilePathFileId, DownloadFileStatus200 } from './DownloadFile'
import { client } from './.kubb/client'

export function getDownloadFileUrl(fileId: DownloadFilePathFileId) {
  const res = { method: 'GET', url: `/files/${fileId}` as const }

  return res
}

/**
 * {@link /files/:fileId}
 */
export async function downloadFile(fileId: DownloadFilePathFileId, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<DownloadFileStatus200, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getDownloadFileUrl(fileId).url.toString(),
    responseType: 'blob',
    ...requestConfig,
  })

  return res.data
}
