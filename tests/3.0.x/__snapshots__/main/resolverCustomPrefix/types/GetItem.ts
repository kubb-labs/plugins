// Custom banner

import type { CustomItem } from './Item'

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

export type CustomGetItemOptions = {
    body?: never;
    path: CustomGetItemPath;
    query?: never;
    headers?: never;
};

export type CustomGetItemResponses = {
    "200": CustomGetItemStatus200;
};

/**
 * @description Union of all possible responses
*/
export type CustomGetItemResponse = CustomGetItemStatus200;