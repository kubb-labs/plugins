// version: 1.0.11

/**
 * @type string | undefined
*/
export type DeletePetHeaderApiKey = string | undefined;

/**
 * @description Pet id to delete
 * @type integer
*/
export type DeletePetPathPetId = number;

/**
 * @type any
*/
export type DeletePetStatus400 = any;

/**
 * @type object
*/
export type DeletePetRequestConfig = {
    data?: never;
    /**
     * @type object
    */
    pathParams: {
        pet_id: DeletePetPathPetId;
    };
    queryParams?: never;
    /**
     * @type object | undefined
    */
    headerParams?: {
        api_key?: DeletePetHeaderApiKey;
    };
    /**
     * @type string
    */
    url: `/pet/${string}`;
};

/**
 * @type object
*/
export type DeletePetResponses = {
    "400": DeletePetStatus400;
};

/**
 * @description Union of all possible responses
*/
export type DeletePetResponse = DeletePetStatus400;