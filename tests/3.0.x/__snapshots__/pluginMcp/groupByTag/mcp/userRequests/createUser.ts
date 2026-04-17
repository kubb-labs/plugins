import fetch from "@kubb/plugin-client/clients/axios";
import type { CreateUserData, CreateUserResponse } from "../../types/CreateUser.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUserHandler({ data }: { data?: CreateUserData } = {}): Promise<Promise<CallToolResult>> {


  const requestData = data


  const res = await fetch<CreateUserResponse, ResponseErrorConfig<Error>, CreateUserData>({ method: "POST", url: `/user`, data: requestData })

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