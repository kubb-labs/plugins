export type {
  AddPetBody,
  AddPetBodyFormUrlEncoded,
  AddPetBodyJson,
  AddPetBodyXml,
  AddPetOptions,
  AddPetResponse,
  AddPetResponses,
  AddPetStatus200,
  AddPetStatus200Json,
  AddPetStatus200Xml,
  AddPetStatus405,
} from './ts/AddPet'
export type { AddPetRequest, AddPetRequestStatusEnumKey } from './ts/AddPetRequest'
export type { ApiResponse } from './ts/ApiResponse'
export type { Category } from './ts/Category'
export type {
  CreatePetsBody,
  CreatePetsHeaders,
  CreatePetsOptions,
  CreatePetsPath,
  CreatePetsQuery,
  CreatePetsResponse,
  CreatePetsResponses,
  CreatePetsStatus201,
  CreatePetsStatusDefault,
  CreatePetsXEXAMPLEKey,
} from './ts/CreatePets'
export type {
  DeleteOrderOptions,
  DeleteOrderPath,
  DeleteOrderResponse,
  DeleteOrderResponses,
  DeleteOrderStatus400,
  DeleteOrderStatus404,
} from './ts/DeleteOrder'
export type { DeletePetHeaders, DeletePetOptions, DeletePetPath, DeletePetResponse, DeletePetResponses, DeletePetStatus400 } from './ts/DeletePet'
export type {
  FindPetsByStatusOptions,
  FindPetsByStatusQuery,
  FindPetsByStatusResponse,
  FindPetsByStatusResponses,
  FindPetsByStatusStatus200,
  FindPetsByStatusStatus200Json,
  FindPetsByStatusStatus200Xml,
  FindPetsByStatusStatus400,
  FindPetsByStatusStatusKey,
} from './ts/FindPetsByStatus'
export type {
  FindPetsByTagsHeaders,
  FindPetsByTagsOptions,
  FindPetsByTagsQuery,
  FindPetsByTagsResponse,
  FindPetsByTagsResponses,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus200Json,
  FindPetsByTagsStatus200Xml,
  FindPetsByTagsStatus400,
  FindPetsByTagsXEXAMPLEKey,
} from './ts/FindPetsByTags'
export type { GetInventoryOptions, GetInventoryResponse, GetInventoryResponses, GetInventoryStatus200 } from './ts/GetInventory'
export type {
  GetOrderByIdOptions,
  GetOrderByIdPath,
  GetOrderByIdResponse,
  GetOrderByIdResponses,
  GetOrderByIdStatus200,
  GetOrderByIdStatus200Json,
  GetOrderByIdStatus200Xml,
  GetOrderByIdStatus400,
  GetOrderByIdStatus404,
} from './ts/GetOrderById'
export type {
  GetPetByIdOptions,
  GetPetByIdPath,
  GetPetByIdResponse,
  GetPetByIdResponses,
  GetPetByIdStatus200,
  GetPetByIdStatus200Json,
  GetPetByIdStatus200Xml,
  GetPetByIdStatus400,
  GetPetByIdStatus404,
} from './ts/GetPetById'
export type { GetThingsOptions, GetThingsQuery, GetThingsResponse, GetThingsResponses, GetThingsStatus201, GetThingsStatusDefault } from './ts/GetThings'
export type { Order, OrderHttpStatusEnumKey, OrderStatusEnumKey, OrderValueEnumKey } from './ts/Order'
export type { Pet, PetStatusEnumKey } from './ts/Pet'
export type { PetNotFound } from './ts/PetNotFound'
export type { PhoneNumber } from './ts/PhoneNumber'
export type { PhoneWithMaxLength } from './ts/PhoneWithMaxLength'
export type { PhoneWithMaxLengthExplicit } from './ts/PhoneWithMaxLengthExplicit'
export type {
  PlaceOrderBody,
  PlaceOrderBodyFormUrlEncoded,
  PlaceOrderBodyJson,
  PlaceOrderBodyXml,
  PlaceOrderOptions,
  PlaceOrderResponse,
  PlaceOrderResponses,
  PlaceOrderStatus200,
  PlaceOrderStatus405,
} from './ts/PlaceOrder'
export type {
  PlaceOrderPatchBody,
  PlaceOrderPatchBodyFormUrlEncoded,
  PlaceOrderPatchBodyJson,
  PlaceOrderPatchBodyXml,
  PlaceOrderPatchOptions,
  PlaceOrderPatchResponse,
  PlaceOrderPatchResponses,
  PlaceOrderPatchStatus200,
  PlaceOrderPatchStatus405,
} from './ts/PlaceOrderPatch'
export type { Tag } from './ts/Tag'
export type {
  UpdatePetBody,
  UpdatePetBodyFormUrlEncoded,
  UpdatePetBodyJson,
  UpdatePetBodyXml,
  UpdatePetOptions,
  UpdatePetResponse,
  UpdatePetResponses,
  UpdatePetStatus200,
  UpdatePetStatus200Json,
  UpdatePetStatus200Xml,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from './ts/UpdatePet'
export type {
  UpdatePetWithFormOptions,
  UpdatePetWithFormPath,
  UpdatePetWithFormQuery,
  UpdatePetWithFormResponse,
  UpdatePetWithFormResponses,
  UpdatePetWithFormStatus405,
} from './ts/UpdatePetWithForm'
export type {
  UploadFileBody,
  UploadFileOptions,
  UploadFilePath,
  UploadFileQuery,
  UploadFileResponse,
  UploadFileResponses,
  UploadFileStatus200,
} from './ts/UploadFile'
export type { AddPetRequestSchemaType } from './zod/addPetRequestSchema'
export type {
  AddPetBodySchemaFormUrlEncodedType,
  AddPetBodySchemaJsonType,
  AddPetBodySchemaType,
  AddPetBodySchemaXmlType,
  AddPetErrorSchemaType,
  AddPetOptionsSchemaType,
  AddPetResponseSchemaType,
  AddPetStatus200SchemaJsonType,
  AddPetStatus200SchemaType,
  AddPetStatus200SchemaXmlType,
  AddPetStatus405SchemaType,
} from './zod/addPetSchema'
export type { ApiResponseSchemaType } from './zod/apiResponseSchema'
export type { CategorySchemaType } from './zod/categorySchema'
export type {
  CreatePetsBodySchemaType,
  CreatePetsErrorSchemaType,
  CreatePetsHeaderXEXAMPLESchemaType,
  CreatePetsHeadersSchemaType,
  CreatePetsOptionsSchemaType,
  CreatePetsPathSchemaType,
  CreatePetsPathUuidSchemaType,
  CreatePetsQueryOffsetSchemaType,
  CreatePetsQuerySchemaType,
  CreatePetsResponseSchemaType,
  CreatePetsStatus201SchemaType,
  CreatePetsStatusDefaultSchemaType,
} from './zod/createPetsSchema'
export type {
  DeleteOrderErrorSchemaType,
  DeleteOrderOptionsSchemaType,
  DeleteOrderPathOrderIdSchemaType,
  DeleteOrderPathSchemaType,
  DeleteOrderResponseSchemaType,
  DeleteOrderStatus400SchemaType,
  DeleteOrderStatus404SchemaType,
} from './zod/deleteOrderSchema'
export type {
  DeletePetErrorSchemaType,
  DeletePetHeaderApiKeySchemaType,
  DeletePetHeadersSchemaType,
  DeletePetOptionsSchemaType,
  DeletePetPathPetIdSchemaType,
  DeletePetPathSchemaType,
  DeletePetResponseSchemaType,
  DeletePetStatus400SchemaType,
} from './zod/deletePetSchema'
export type {
  FindPetsByStatusErrorSchemaType,
  FindPetsByStatusOptionsSchemaType,
  FindPetsByStatusQuerySchemaType,
  FindPetsByStatusQueryStatusSchemaType,
  FindPetsByStatusResponseSchemaType,
  FindPetsByStatusStatus200SchemaJsonType,
  FindPetsByStatusStatus200SchemaType,
  FindPetsByStatusStatus200SchemaXmlType,
  FindPetsByStatusStatus400SchemaType,
} from './zod/findPetsByStatusSchema'
export type {
  FindPetsByTagsErrorSchemaType,
  FindPetsByTagsHeaderXEXAMPLESchemaType,
  FindPetsByTagsHeadersSchemaType,
  FindPetsByTagsOptionsSchemaType,
  FindPetsByTagsQueryPageSchemaType,
  FindPetsByTagsQueryPageSizeSchemaType,
  FindPetsByTagsQuerySchemaType,
  FindPetsByTagsQueryTagsSchemaType,
  FindPetsByTagsResponseSchemaType,
  FindPetsByTagsStatus200SchemaJsonType,
  FindPetsByTagsStatus200SchemaType,
  FindPetsByTagsStatus200SchemaXmlType,
  FindPetsByTagsStatus400SchemaType,
} from './zod/findPetsByTagsSchema'
export type { GetInventoryOptionsSchemaType, GetInventoryResponseSchemaType, GetInventoryStatus200SchemaType } from './zod/getInventorySchema'
export type {
  GetOrderByIdErrorSchemaType,
  GetOrderByIdOptionsSchemaType,
  GetOrderByIdPathOrderIdSchemaType,
  GetOrderByIdPathSchemaType,
  GetOrderByIdResponseSchemaType,
  GetOrderByIdStatus200SchemaJsonType,
  GetOrderByIdStatus200SchemaType,
  GetOrderByIdStatus200SchemaXmlType,
  GetOrderByIdStatus400SchemaType,
  GetOrderByIdStatus404SchemaType,
} from './zod/getOrderByIdSchema'
export type {
  GetPetByIdErrorSchemaType,
  GetPetByIdOptionsSchemaType,
  GetPetByIdPathPetIdSchemaType,
  GetPetByIdPathSchemaType,
  GetPetByIdResponseSchemaType,
  GetPetByIdStatus200SchemaJsonType,
  GetPetByIdStatus200SchemaType,
  GetPetByIdStatus200SchemaXmlType,
  GetPetByIdStatus400SchemaType,
  GetPetByIdStatus404SchemaType,
} from './zod/getPetByIdSchema'
export type {
  GetThingsErrorSchemaType,
  GetThingsOptionsSchemaType,
  GetThingsQueryLimitSchemaType,
  GetThingsQuerySchemaType,
  GetThingsQuerySkipSchemaType,
  GetThingsResponseSchemaType,
  GetThingsStatus201SchemaType,
  GetThingsStatusDefaultSchemaType,
} from './zod/getThingsSchema'
export type { OrderSchemaType } from './zod/orderSchema'
export type { PetNotFoundSchemaType } from './zod/petNotFoundSchema'
export type { PetSchemaType } from './zod/petSchema'
export type { PhoneNumberSchemaType } from './zod/phoneNumberSchema'
export type { PhoneWithMaxLengthExplicitSchemaType } from './zod/phoneWithMaxLengthExplicitSchema'
export type { PhoneWithMaxLengthSchemaType } from './zod/phoneWithMaxLengthSchema'
export type {
  PlaceOrderPatchBodySchemaFormUrlEncodedType,
  PlaceOrderPatchBodySchemaJsonType,
  PlaceOrderPatchBodySchemaType,
  PlaceOrderPatchBodySchemaXmlType,
  PlaceOrderPatchErrorSchemaType,
  PlaceOrderPatchOptionsSchemaType,
  PlaceOrderPatchResponseSchemaType,
  PlaceOrderPatchStatus200SchemaType,
  PlaceOrderPatchStatus405SchemaType,
} from './zod/placeOrderPatchSchema'
export type {
  PlaceOrderBodySchemaFormUrlEncodedType,
  PlaceOrderBodySchemaJsonType,
  PlaceOrderBodySchemaType,
  PlaceOrderBodySchemaXmlType,
  PlaceOrderErrorSchemaType,
  PlaceOrderOptionsSchemaType,
  PlaceOrderResponseSchemaType,
  PlaceOrderStatus200SchemaType,
  PlaceOrderStatus405SchemaType,
} from './zod/placeOrderSchema'
export type { TagSchemaType } from './zod/tagSchema'
export type {
  UpdatePetBodySchemaFormUrlEncodedType,
  UpdatePetBodySchemaJsonType,
  UpdatePetBodySchemaType,
  UpdatePetBodySchemaXmlType,
  UpdatePetErrorSchemaType,
  UpdatePetOptionsSchemaType,
  UpdatePetResponseSchemaType,
  UpdatePetStatus200SchemaJsonType,
  UpdatePetStatus200SchemaType,
  UpdatePetStatus200SchemaXmlType,
  UpdatePetStatus400SchemaType,
  UpdatePetStatus404SchemaType,
  UpdatePetStatus405SchemaType,
} from './zod/updatePetSchema'
export type {
  UpdatePetWithFormErrorSchemaType,
  UpdatePetWithFormOptionsSchemaType,
  UpdatePetWithFormPathPetIdSchemaType,
  UpdatePetWithFormPathSchemaType,
  UpdatePetWithFormQueryNameSchemaType,
  UpdatePetWithFormQuerySchemaType,
  UpdatePetWithFormQueryStatusSchemaType,
  UpdatePetWithFormResponseSchemaType,
  UpdatePetWithFormStatus405SchemaType,
} from './zod/updatePetWithFormSchema'
export type {
  UploadFileBodySchemaType,
  UploadFileOptionsSchemaType,
  UploadFilePathPetIdSchemaType,
  UploadFilePathSchemaType,
  UploadFileQueryAdditionalMetadataSchemaType,
  UploadFileQuerySchemaType,
  UploadFileResponseSchemaType,
  UploadFileStatus200SchemaType,
} from './zod/uploadFileSchema'
export { addPetRequestStatusEnum } from './ts/AddPetRequest'
export { createPetsXEXAMPLE } from './ts/CreatePets'
export { findPetsByStatusStatus } from './ts/FindPetsByStatus'
export { findPetsByTagsXEXAMPLE } from './ts/FindPetsByTags'
export { orderHttpStatusEnum, orderStatusEnum, orderValueEnum } from './ts/Order'
export { petStatusEnum } from './ts/Pet'
export { addPetRequestSchema } from './zod/addPetRequestSchema'
export {
  addPetBodySchema,
  addPetBodySchemaFormUrlEncoded,
  addPetBodySchemaJson,
  addPetBodySchemaXml,
  addPetErrorSchema,
  addPetOptionsSchema,
  addPetResponseSchema,
  addPetStatus200Schema,
  addPetStatus200SchemaJson,
  addPetStatus200SchemaXml,
  addPetStatus405Schema,
} from './zod/addPetSchema'
export { apiResponseSchema } from './zod/apiResponseSchema'
export { categorySchema } from './zod/categorySchema'
export {
  createPetsBodySchema,
  createPetsErrorSchema,
  createPetsHeaderXEXAMPLESchema,
  createPetsHeadersSchema,
  createPetsOptionsSchema,
  createPetsPathSchema,
  createPetsPathUuidSchema,
  createPetsQueryOffsetSchema,
  createPetsQuerySchema,
  createPetsResponseSchema,
  createPetsStatus201Schema,
  createPetsStatusDefaultSchema,
} from './zod/createPetsSchema'
export {
  deleteOrderErrorSchema,
  deleteOrderOptionsSchema,
  deleteOrderPathOrderIdSchema,
  deleteOrderPathSchema,
  deleteOrderResponseSchema,
  deleteOrderStatus400Schema,
  deleteOrderStatus404Schema,
} from './zod/deleteOrderSchema'
export {
  deletePetErrorSchema,
  deletePetHeaderApiKeySchema,
  deletePetHeadersSchema,
  deletePetOptionsSchema,
  deletePetPathPetIdSchema,
  deletePetPathSchema,
  deletePetResponseSchema,
  deletePetStatus400Schema,
} from './zod/deletePetSchema'
export {
  findPetsByStatusErrorSchema,
  findPetsByStatusOptionsSchema,
  findPetsByStatusQuerySchema,
  findPetsByStatusQueryStatusSchema,
  findPetsByStatusResponseSchema,
  findPetsByStatusStatus200Schema,
  findPetsByStatusStatus200SchemaJson,
  findPetsByStatusStatus200SchemaXml,
  findPetsByStatusStatus400Schema,
} from './zod/findPetsByStatusSchema'
export {
  findPetsByTagsErrorSchema,
  findPetsByTagsHeaderXEXAMPLESchema,
  findPetsByTagsHeadersSchema,
  findPetsByTagsOptionsSchema,
  findPetsByTagsQueryPageSchema,
  findPetsByTagsQueryPageSizeSchema,
  findPetsByTagsQuerySchema,
  findPetsByTagsQueryTagsSchema,
  findPetsByTagsResponseSchema,
  findPetsByTagsStatus200Schema,
  findPetsByTagsStatus200SchemaJson,
  findPetsByTagsStatus200SchemaXml,
  findPetsByTagsStatus400Schema,
} from './zod/findPetsByTagsSchema'
export { getInventoryOptionsSchema, getInventoryResponseSchema, getInventoryStatus200Schema } from './zod/getInventorySchema'
export {
  getOrderByIdErrorSchema,
  getOrderByIdOptionsSchema,
  getOrderByIdPathOrderIdSchema,
  getOrderByIdPathSchema,
  getOrderByIdResponseSchema,
  getOrderByIdStatus200Schema,
  getOrderByIdStatus200SchemaJson,
  getOrderByIdStatus200SchemaXml,
  getOrderByIdStatus400Schema,
  getOrderByIdStatus404Schema,
} from './zod/getOrderByIdSchema'
export {
  getPetByIdErrorSchema,
  getPetByIdOptionsSchema,
  getPetByIdPathPetIdSchema,
  getPetByIdPathSchema,
  getPetByIdResponseSchema,
  getPetByIdStatus200Schema,
  getPetByIdStatus200SchemaJson,
  getPetByIdStatus200SchemaXml,
  getPetByIdStatus400Schema,
  getPetByIdStatus404Schema,
} from './zod/getPetByIdSchema'
export {
  getThingsErrorSchema,
  getThingsOptionsSchema,
  getThingsQueryLimitSchema,
  getThingsQuerySchema,
  getThingsQuerySkipSchema,
  getThingsResponseSchema,
  getThingsStatus201Schema,
  getThingsStatusDefaultSchema,
} from './zod/getThingsSchema'
export { OperationSchema, OperationsMap, operations, paths } from './zod/operationsSchema'
export { orderSchema } from './zod/orderSchema'
export { petNotFoundSchema } from './zod/petNotFoundSchema'
export { petSchema } from './zod/petSchema'
export { phoneNumberSchema } from './zod/phoneNumberSchema'
export { phoneWithMaxLengthExplicitSchema } from './zod/phoneWithMaxLengthExplicitSchema'
export { phoneWithMaxLengthSchema } from './zod/phoneWithMaxLengthSchema'
export {
  placeOrderPatchBodySchema,
  placeOrderPatchBodySchemaFormUrlEncoded,
  placeOrderPatchBodySchemaJson,
  placeOrderPatchBodySchemaXml,
  placeOrderPatchErrorSchema,
  placeOrderPatchOptionsSchema,
  placeOrderPatchResponseSchema,
  placeOrderPatchStatus200Schema,
  placeOrderPatchStatus405Schema,
} from './zod/placeOrderPatchSchema'
export {
  placeOrderBodySchema,
  placeOrderBodySchemaFormUrlEncoded,
  placeOrderBodySchemaJson,
  placeOrderBodySchemaXml,
  placeOrderErrorSchema,
  placeOrderOptionsSchema,
  placeOrderResponseSchema,
  placeOrderStatus200Schema,
  placeOrderStatus405Schema,
} from './zod/placeOrderSchema'
export { tagSchema } from './zod/tagSchema'
export {
  updatePetBodySchema,
  updatePetBodySchemaFormUrlEncoded,
  updatePetBodySchemaJson,
  updatePetBodySchemaXml,
  updatePetErrorSchema,
  updatePetOptionsSchema,
  updatePetResponseSchema,
  updatePetStatus200Schema,
  updatePetStatus200SchemaJson,
  updatePetStatus200SchemaXml,
  updatePetStatus400Schema,
  updatePetStatus404Schema,
  updatePetStatus405Schema,
} from './zod/updatePetSchema'
export {
  updatePetWithFormErrorSchema,
  updatePetWithFormOptionsSchema,
  updatePetWithFormPathPetIdSchema,
  updatePetWithFormPathSchema,
  updatePetWithFormQueryNameSchema,
  updatePetWithFormQuerySchema,
  updatePetWithFormQueryStatusSchema,
  updatePetWithFormResponseSchema,
  updatePetWithFormStatus405Schema,
} from './zod/updatePetWithFormSchema'
export {
  uploadFileBodySchema,
  uploadFileOptionsSchema,
  uploadFilePathPetIdSchema,
  uploadFilePathSchema,
  uploadFileQueryAdditionalMetadataSchema,
  uploadFileQuerySchema,
  uploadFileResponseSchema,
  uploadFileStatus200Schema,
} from './zod/uploadFileSchema'
