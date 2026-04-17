import fetch from "@kubb/plugin-client/clients/axios";
import type { LogoutUserResponse } from "../../types/LogoutUser.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUserHandler(): Promise<Promise<CallToolResult>> {




  const res = await fetch<LogoutUserResponse, ResponseErrorConfig<Error>, unknown>({ method: "GET", url: `/user/logout` })

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