import client from "@kubb/plugin-client/clients/axios";
import type { CreateUserData, CreateUserResponse } from "../../types/CreateUser.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type { CallToolResult, ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types";

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUserHandler({ data }: { data?: CreateUserData } = {}, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {


  const requestData = data


  const res = await client<CreateUserResponse, ResponseErrorConfig<Error>, CreateUserData>({ method: "POST", url: `/user`, data: requestData }, request)

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