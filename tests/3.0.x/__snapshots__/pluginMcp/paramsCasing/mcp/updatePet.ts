import fetch from "@kubb/plugin-client/clients/axios";
import type { UpdatePetData, UpdatePetPathPetId, UpdatePetQueryIncludeDeleted, UpdatePetQueryRequestSource, UpdatePetResponse } from "../types/UpdatePet.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * {@link /pets/:pet_id}
 */
export async function updatePetHandler({ petId, data, params }: { petId: UpdatePetPathPetId; data: UpdatePetData; params?: { includeDeleted?: UpdatePetQueryIncludeDeleted; requestSource?: UpdatePetQueryRequestSource } }): Promise<Promise<CallToolResult>> {


  const pet_id = petId


  const mappedParams = params ? { "include_deleted": params.includeDeleted, "request_source": params.requestSource } : undefined


  const requestData = data


  const res = await fetch<UpdatePetResponse, ResponseErrorConfig<Error>, UpdatePetData>({ method: "POST", url: `/pets/${pet_id}`, params: mappedParams, data: requestData })

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