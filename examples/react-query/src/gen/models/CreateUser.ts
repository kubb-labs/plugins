// version: 1.0.11

import type { User } from "./User.ts";

/**
 * @type object
*/
export type CreateUserStatusDefault = User;

/**
 * @description Created user object
 * @type object | undefined
*/
export type CreateUserData = User | undefined;

/**
 * @type object
*/
export type CreateUserRequestConfig = {
    data?: CreateUserData;
    pathParams?: never;
    queryParams?: never;
    headerParams?: never;
    /**
     * @type string
    */
    url: "/user";
};

/**
 * @type object
*/
export type CreateUserResponses = {
    default: CreateUserStatusDefault;
};

/**
 * @description Union of all possible responses
*/
export type CreateUserResponse = CreateUserStatusDefault;