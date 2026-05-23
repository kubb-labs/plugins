import client from "@kubb/plugin-client/clients/axios";
import type { UpdatePetData, UpdatePetPathPetId, UpdatePetQueryIncludeDeleted, UpdatePetQueryRequestSource, UpdatePetResponse } from "../types/UpdatePet.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type { CallToolResult, ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types";

/**
 * {@link /pets/:pet_id}
 */
export async function updatePetHandler({ petId, data, params }: { petId: UpdatePetPathPetId; data: UpdatePetData; params?: { includeDeleted?: UpdatePetQueryIncludeDeleted; requestSource?: UpdatePetQueryRequestSource } }, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {


  const pet_id = petId


  const mappedParams = params ? { "include_deleted": params.includeDeleted, "request_source": params.requestSource } : undefined


  const requestData = data


  const res = await client<UpdatePetResponse, ResponseErrorConfig<Error>, UpdatePetData>({ method: "POST", url: `/pets/${pet_id}`, params: mappedParams, data: requestData }, request)

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