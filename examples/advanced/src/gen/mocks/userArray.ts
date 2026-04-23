import type { UserArray } from "../models/ts/UserArray.ts";
import { userFaker } from "./user.ts";
import { faker } from "@faker-js/faker";

export function userArrayFaker(data?: UserArray): UserArray {

  return [
    ...faker.helpers.multiple(() => (userFaker())),
    ...(data || [])
  ]
}