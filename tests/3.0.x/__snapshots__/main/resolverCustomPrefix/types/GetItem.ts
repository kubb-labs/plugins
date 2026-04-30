// Custom banner

/**
 * @type integer
*/
export type GetItemPathId = bigint;

/**
 * @description A simple item
 * @type object
*/
export type GetItemStatus200 = Item;

/**
 * @type object
*/
export type GetItemRequestConfig = {
    data?: never;
    /**
     * @type object
    */
    pathParams: {
        id: GetItemPathId;
    };
    queryParams?: never;
    headerParams?: never;
    /**
     * @type string
    */
    url: `/items/${string}`;
};

/**
 * @type object
*/
export type GetItemResponses = {
    "200": GetItemStatus200;
};

/**
 * @description Union of all possible responses
*/
export type GetItemResponse = GetItemStatus200;