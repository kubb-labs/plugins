// Custom banner

/**
 * @type integer
*/
export type CustomGetItemPathId = bigint;

/**
 * @type object
*/
export type CustomGetItemRequestConfig = {
    data?: never;
    /**
     * @type object
    */
    pathParams: {
        id: CustomGetItemPathId;
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
export type CustomGetItemResponses = {
    /**
     * @description A simple item
     * @type object
    */
    "200": Item;
};

/**
 * @description Union of all possible responses
*/
export type CustomGetItemResponse = Item;