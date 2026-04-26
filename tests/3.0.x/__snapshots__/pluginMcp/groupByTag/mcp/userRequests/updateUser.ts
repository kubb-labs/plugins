import fetch from "@kubb/plugin-client/clients/axios";
import type { UpdateUserData, UpdateUserPathUsername, UpdateUserResponse } from "../../types/UpdateUser.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type { CallToolResult, ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types";

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export async function updateUserHandler({ username, data }: { username: UpdateUserPathUsername; data?: UpdateUserData }, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {


  const requestData = data


  const res = await fetch<UpdateUserResponse, ResponseErrorConfig<Error>, UpdateUserData>({ method: "PUT", url: `/user/${username}`, data: requestData }, request)

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