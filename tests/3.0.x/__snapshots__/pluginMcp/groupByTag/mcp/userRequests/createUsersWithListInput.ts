import fetch from "@kubb/plugin-client/clients/axios";
import type { CreateUsersWithListInputData, CreateUsersWithListInputResponse } from "../../types/CreateUsersWithListInput.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult, RequestHandlerExtra } from "@modelcontextprotocol/sdk/types";

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export async function createUsersWithListInputHandler({ data }: { data?: CreateUsersWithListInputData } = {}, request: RequestHandlerExtra): Promise<Promise<CallToolResult>> {


  const requestData = data


  const res = await fetch<CreateUsersWithListInputResponse, ResponseErrorConfig<Error>, CreateUsersWithListInputData>({ method: "POST", url: `/user/createWithList`, data: requestData }, request)

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