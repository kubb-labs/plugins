// Custom banner

import type { CustomItem } from './Item.ts'

/**
 * @description
 * Format: `int64`
 * @type integer
*/
export type CustomGetItemPathId = bigint;

/**
 * @description A simple item
 * @type object
*/
export type CustomGetItemStatus200 = CustomItem;

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
    "200": CustomGetItemStatus200;
};

/**
 * @description Union of all possible responses
*/
export type CustomGetItemResponse = CustomGetItemStatus200;