import fetch from '@kubb/plugin-client/clients/axios'
import type { UploadFilePathPetId, UploadFileQueryAdditionalMetadata, UploadFileResponse } from '../../models/ts/petController/UploadFile.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFileHandler({
  petId,
  data,
  params,
}: {
  petId: UploadFilePathPetId
  data: UploadFileData
  params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata }
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<UploadFileResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'POST',
    url: `/pet/${petId}/uploadImage`,
    baseURL: `https://petstore.swagger.io/v2`,
    params,
  })

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
    structuredContent: { data: res.data },
  }
}
