// Custom banner

/**
 * @description A simple item
 * @type object
*/
export type CustomItem = {
    /**
     * @description Unique identifier
     * @type integer
    */
    id: bigint;
    /**
     * @description Display name
     * @type string
    */
    name: string;
    /**
     * @type integer | undefined
    */
    count?: number;
};