import type { z } from '../../zod.ts'
import { addPetBodySchema, addPetStatus200Schema, addPetStatus405Schema, addPetResponseSchema } from './addPetSchema.ts'
import {
  createPetsBodySchema,
  createPetsStatus201Schema,
  createPetsResponseSchema,
  createPetsPathUuidSchema,
  createPetsQueryOffsetSchema,
  createPetsHeaderXEXAMPLESchema,
} from './createPetsSchema.ts'
import { deleteOrderStatus400Schema, deleteOrderStatus404Schema, deleteOrderResponseSchema, deleteOrderPathOrderIdSchema } from './deleteOrderSchema.ts'
import { deletePetStatus400Schema, deletePetResponseSchema, deletePetPathPetIdSchema, deletePetHeaderApiKeySchema } from './deletePetSchema.ts'
import {
  findPetsByStatusStatus200Schema,
  findPetsByStatusStatus400Schema,
  findPetsByStatusResponseSchema,
  findPetsByStatusQueryStatusSchema,
} from './findPetsByStatusSchema.ts'
import {
  findPetsByTagsStatus200Schema,
  findPetsByTagsStatus400Schema,
  findPetsByTagsResponseSchema,
  findPetsByTagsQueryTagsSchema,
  findPetsByTagsHeaderXEXAMPLESchema,
} from './findPetsByTagsSchema.ts'
import { getInventoryStatus200Schema, getInventoryResponseSchema } from './getInventorySchema.ts'
import {
  getOrderByIdStatus200Schema,
  getOrderByIdStatus400Schema,
  getOrderByIdStatus404Schema,
  getOrderByIdResponseSchema,
  getOrderByIdPathOrderIdSchema,
} from './getOrderByIdSchema.ts'
import {
  getPetByIdStatus200Schema,
  getPetByIdStatus400Schema,
  getPetByIdStatus404Schema,
  getPetByIdResponseSchema,
  getPetByIdPathPetIdSchema,
} from './getPetByIdSchema.ts'
import { getThingsStatus201Schema, getThingsResponseSchema, getThingsQueryLimitSchema } from './getThingsSchema.ts'
import {
  placeOrderPatchBodySchema,
  placeOrderPatchStatus200Schema,
  placeOrderPatchStatus405Schema,
  placeOrderPatchResponseSchema,
} from './placeOrderPatchSchema.ts'
import { placeOrderBodySchema, placeOrderStatus200Schema, placeOrderStatus405Schema, placeOrderResponseSchema } from './placeOrderSchema.ts'
import {
  updatePetBodySchema,
  updatePetStatus200Schema,
  updatePetStatus400Schema,
  updatePetStatus404Schema,
  updatePetStatus405Schema,
  updatePetResponseSchema,
} from './updatePetSchema.ts'
import {
  updatePetWithFormStatus405Schema,
  updatePetWithFormResponseSchema,
  updatePetWithFormPathPetIdSchema,
  updatePetWithFormQueryNameSchema,
} from './updatePetWithFormSchema.ts'
import {
  uploadFileBodySchema,
  uploadFileStatus200Schema,
  uploadFileResponseSchema,
  uploadFilePathPetIdSchema,
  uploadFileQueryAdditionalMetadataSchema,
} from './uploadFileSchema.ts'

export type OperationSchema = {
  readonly request: z.ZodTypeAny | undefined
  readonly parameters: {
    readonly path: z.ZodTypeAny | undefined
    readonly query: z.ZodTypeAny | undefined
    readonly header: z.ZodTypeAny | undefined
  }
  readonly responses: {
    readonly [status: number]: z.ZodTypeAny
    readonly default: z.ZodTypeAny
  }
  readonly errors: {
    readonly [status: number]: z.ZodTypeAny
  }
}

export type OperationsMap = Record<string, OperationSchema>

export const operations = {
  getThings: {
    request: null,
    parameters: {
      path: null,
      query: getThingsQueryLimitSchema,
      header: null,
    },
    responses: {
      201: getThingsStatus201Schema,
      default: getThingsResponseSchema,
    },
    errors: {},
  },
  createPets: {
    request: createPetsBodySchema,
    parameters: {
      path: createPetsPathUuidSchema,
      query: createPetsQueryOffsetSchema,
      header: createPetsHeaderXEXAMPLESchema,
    },
    responses: {
      201: createPetsStatus201Schema,
      default: createPetsResponseSchema,
    },
    errors: {},
  },
  updatePet: {
    request: updatePetBodySchema,
    parameters: {
      path: null,
      query: null,
      header: null,
    },
    responses: {
      200: updatePetStatus200Schema,
      400: updatePetStatus400Schema,
      404: updatePetStatus404Schema,
      405: updatePetStatus405Schema,
      default: updatePetResponseSchema,
    },
    errors: {
      400: updatePetStatus400Schema,
      404: updatePetStatus404Schema,
      405: updatePetStatus405Schema,
    },
  },
  addPet: {
    request: addPetBodySchema,
    parameters: {
      path: null,
      query: null,
      header: null,
    },
    responses: {
      200: addPetStatus200Schema,
      405: addPetStatus405Schema,
      default: addPetResponseSchema,
    },
    errors: {
      405: addPetStatus405Schema,
    },
  },
  findPetsByStatus: {
    request: null,
    parameters: {
      path: null,
      query: findPetsByStatusQueryStatusSchema,
      header: null,
    },
    responses: {
      200: findPetsByStatusStatus200Schema,
      400: findPetsByStatusStatus400Schema,
      default: findPetsByStatusResponseSchema,
    },
    errors: {
      400: findPetsByStatusStatus400Schema,
    },
  },
  findPetsByTags: {
    request: null,
    parameters: {
      path: null,
      query: findPetsByTagsQueryTagsSchema,
      header: findPetsByTagsHeaderXEXAMPLESchema,
    },
    responses: {
      200: findPetsByTagsStatus200Schema,
      400: findPetsByTagsStatus400Schema,
      default: findPetsByTagsResponseSchema,
    },
    errors: {
      400: findPetsByTagsStatus400Schema,
    },
  },
  getPetById: {
    request: null,
    parameters: {
      path: getPetByIdPathPetIdSchema,
      query: null,
      header: null,
    },
    responses: {
      200: getPetByIdStatus200Schema,
      400: getPetByIdStatus400Schema,
      404: getPetByIdStatus404Schema,
      default: getPetByIdResponseSchema,
    },
    errors: {
      400: getPetByIdStatus400Schema,
      404: getPetByIdStatus404Schema,
    },
  },
  updatePetWithForm: {
    request: null,
    parameters: {
      path: updatePetWithFormPathPetIdSchema,
      query: updatePetWithFormQueryNameSchema,
      header: null,
    },
    responses: {
      405: updatePetWithFormStatus405Schema,
      default: updatePetWithFormResponseSchema,
    },
    errors: {
      405: updatePetWithFormStatus405Schema,
    },
  },
  deletePet: {
    request: null,
    parameters: {
      path: deletePetPathPetIdSchema,
      query: null,
      header: deletePetHeaderApiKeySchema,
    },
    responses: {
      400: deletePetStatus400Schema,
      default: deletePetResponseSchema,
    },
    errors: {
      400: deletePetStatus400Schema,
    },
  },
  uploadFile: {
    request: uploadFileBodySchema,
    parameters: {
      path: uploadFilePathPetIdSchema,
      query: uploadFileQueryAdditionalMetadataSchema,
      header: null,
    },
    responses: {
      200: uploadFileStatus200Schema,
      default: uploadFileResponseSchema,
    },
    errors: {},
  },
  getInventory: {
    request: null,
    parameters: {
      path: null,
      query: null,
      header: null,
    },
    responses: {
      200: getInventoryStatus200Schema,
      default: getInventoryResponseSchema,
    },
    errors: {},
  },
  placeOrder: {
    request: placeOrderBodySchema,
    parameters: {
      path: null,
      query: null,
      header: null,
    },
    responses: {
      200: placeOrderStatus200Schema,
      405: placeOrderStatus405Schema,
      default: placeOrderResponseSchema,
    },
    errors: {
      405: placeOrderStatus405Schema,
    },
  },
  placeOrderPatch: {
    request: placeOrderPatchBodySchema,
    parameters: {
      path: null,
      query: null,
      header: null,
    },
    responses: {
      200: placeOrderPatchStatus200Schema,
      405: placeOrderPatchStatus405Schema,
      default: placeOrderPatchResponseSchema,
    },
    errors: {
      405: placeOrderPatchStatus405Schema,
    },
  },
  getOrderById: {
    request: null,
    parameters: {
      path: getOrderByIdPathOrderIdSchema,
      query: null,
      header: null,
    },
    responses: {
      200: getOrderByIdStatus200Schema,
      400: getOrderByIdStatus400Schema,
      404: getOrderByIdStatus404Schema,
      default: getOrderByIdResponseSchema,
    },
    errors: {
      400: getOrderByIdStatus400Schema,
      404: getOrderByIdStatus404Schema,
    },
  },
  deleteOrder: {
    request: null,
    parameters: {
      path: deleteOrderPathOrderIdSchema,
      query: null,
      header: null,
    },
    responses: {
      400: deleteOrderStatus400Schema,
      404: deleteOrderStatus404Schema,
      default: deleteOrderResponseSchema,
    },
    errors: {
      400: deleteOrderStatus400Schema,
      404: deleteOrderStatus404Schema,
    },
  },
} as const

export const paths = {
  '/pets/{uuid}': {
    GET: operations['getThings'],
    POST: operations['createPets'],
  },
  '/pet': {
    PUT: operations['updatePet'],
    POST: operations['addPet'],
  },
  '/pet/findByStatus': {
    GET: operations['findPetsByStatus'],
  },
  '/pet/findByTags': {
    GET: operations['findPetsByTags'],
  },
  '/pet/{petId}': {
    GET: operations['getPetById'],
    POST: operations['updatePetWithForm'],
    DELETE: operations['deletePet'],
  },
  '/pet/{petId}/uploadImage': {
    POST: operations['uploadFile'],
  },
  '/store/inventory': {
    GET: operations['getInventory'],
  },
  '/store/order': {
    POST: operations['placeOrder'],
    PATCH: operations['placeOrderPatch'],
  },
  '/store/order/{orderId}': {
    GET: operations['getOrderById'],
    DELETE: operations['deleteOrder'],
  },
} as const
