// Custom banner

/**
 * @description
 * Format: `int64`
 * @type integer
*/
export type CustomGetItemPathId = bigint;

/**
 * @type object
*/
export type CustomGetItemRequestConfig = {
    body?: never;
    /**
     * @type object
    */
    path: {
        id: CustomGetItemPathId;
    };
    query?: never;
    headers?: never;
};

/**
 * @type object
*/
export type CustomGetItemResponses = {
    "200": Item;
};

/**
 * @description Union of all possible responses
*/
export type CustomGetItemResponse = Item;