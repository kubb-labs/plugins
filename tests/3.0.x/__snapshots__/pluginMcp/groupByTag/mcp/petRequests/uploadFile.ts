import fetch from "@kubb/plugin-client/clients/axios";
import type { UploadFileData, UploadFilePathPetId, UploadFileQueryAdditionalMetadata, UploadFileResponse } from "../../types/UploadFile.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFileHandler({ petId, data, params }: { petId: UploadFilePathPetId; data?: UploadFileData; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } }): Promise<Promise<CallToolResult>> {


  const requestData = data


  const res = await fetch<UploadFileResponse, ResponseErrorConfig<Error>, UploadFileData>({ method: "POST", url: `/pet/${petId}/uploadImage`, params, data: requestData, headers: { 'Content-Type': 'application/octet-stream' } })

  return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(res.data)
                }
              ],
              structuredContent: { data: res.data }
             }
}