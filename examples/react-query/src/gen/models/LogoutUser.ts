// version: 1.0.11

/**
 * @type any
*/
export type LogoutUserStatusDefault = any;

/**
 * @type object
*/
export type LogoutUserRequestConfig = {
    data?: never;
    pathParams?: never;
    queryParams?: never;
    headerParams?: never;
    /**
     * @type string
    */
    url: "/user/logout";
};

/**
 * @type object
*/
export type LogoutUserResponses = {
    default: LogoutUserStatusDefault;
};

/**
 * @description Union of all possible responses
*/
export type LogoutUserResponse = LogoutUserStatusDefault;