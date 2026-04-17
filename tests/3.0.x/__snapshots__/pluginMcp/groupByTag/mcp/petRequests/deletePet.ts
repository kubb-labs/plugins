import fetch from "@kubb/plugin-client/clients/axios";
import type { DeletePetHeaderApiKey, DeletePetPathPetId, DeletePetResponse, DeletePetStatus400 } from "../../types/DeletePet.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
export async function deletePetHandler({ petId, headers }: { petId: DeletePetPathPetId; headers?: { api_key?: DeletePetHeaderApiKey } }): Promise<Promise<CallToolResult>> {




  const res = await fetch<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, unknown>({ method: "DELETE", url: `/pet/${petId}`, headers: { ...headers } })

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