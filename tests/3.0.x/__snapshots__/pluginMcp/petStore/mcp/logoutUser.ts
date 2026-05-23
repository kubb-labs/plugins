import client from "@kubb/plugin-client/clients/axios";
import type { LogoutUserResponse } from "../types/LogoutUser.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type { CallToolResult, ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types";

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUserHandler(request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {




  const res = await client<LogoutUserResponse, ResponseErrorConfig<Error>, unknown>({ method: "GET", url: `/user/logout` }, request)

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