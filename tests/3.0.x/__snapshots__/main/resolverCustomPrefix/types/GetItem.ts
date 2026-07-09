// Custom banner

import type { CustomItem } from './Item'

/**
 * @type object
*/
export type CustomGetItemPath = {
    /**
     * @description
     * Format: `int64`
     * @type integer
    */
    id: bigint;
};

/**
 * @description A simple item
 * @type object
*/
export type CustomGetItemStatus200 = CustomItem;

/**
 * @type object
*/
export type CustomGetItemOptions = {
    body?: never;
    path: CustomGetItemPath;
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