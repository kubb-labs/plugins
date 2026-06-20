/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { DownloadFileRequestConfig, DownloadFileStatus200 } from './DownloadFile'
import { client } from './.kubb/client'

export function getDownloadFileUrl(path: DownloadFileRequestConfig['path']) {
  const res = { method: 'GET', url: `/files/${path.fileId}` as const }

  return res
}

/**
 * {@link /files/:fileId}
 */
export async function downloadFile({ path }: DownloadFileRequestConfig, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<DownloadFileStatus200, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getDownloadFileUrl(path).url.toString(),
    responseType: 'blob',
    ...requestConfig,
  })

  return res.data
}
