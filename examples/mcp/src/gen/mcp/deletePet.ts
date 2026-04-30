import fetch from "../../client.js";
import type { ResponseErrorConfig } from "../../client.js";
import type { DeletePetHeaderApiKey, DeletePetPathPetId, DeletePetResponse, DeletePetStatus400 } from "../models/ts/DeletePet.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type { CallToolResult, ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types";

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
export async function deletePetHandler({ petId, headers }: { petId: DeletePetPathPetId; headers?: { api_key?: DeletePetHeaderApiKey } }, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {




  const res = await fetch<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, unknown>({ method: "DELETE", url: `/pet/${petId}`, baseURL: `https://petstore.swagger.io/v2`, headers: { ...headers } }, request)

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