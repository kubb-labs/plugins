// Custom banner

/**
 * @description A simple item
 * @type object
*/
export type CustomItem = {
    /**
     * @description Unique identifier
     *
     * Format: `int64`
     * @type integer
    */
    id: bigint;
    /**
     * @description Display name
     * @type string
    */
    name: string;
    /**
     * @description Format: `int32`
     * @type integer | undefined
    */
    count?: number;
};