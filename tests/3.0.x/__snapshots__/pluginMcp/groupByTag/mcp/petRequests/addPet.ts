import fetch from "@kubb/plugin-client/clients/axios";
import type { AddPetData, AddPetResponse, AddPetStatus405 } from "../../types/AddPet.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPetHandler({ data }: { data: AddPetData }): Promise<Promise<CallToolResult>> {


  const requestData = data


  const res = await fetch<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, AddPetData>({ method: "POST", url: `/pet`, data: requestData })

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