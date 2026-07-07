export type {
  AddPetBody,
  AddPetBodyFormUrlEncoded,
  AddPetBodyJson,
  AddPetBodyXml,
  AddPetRequestConfig,
  AddPetResponse,
  AddPetResponses,
  AddPetStatus200,
  AddPetStatus200Json,
  AddPetStatus200Xml,
  AddPetStatus405,
} from './ts/AddPet.ts'
export type { AddPetRequest, AddPetRequestStatusEnumKey } from './ts/AddPetRequest.ts'
export type { ApiResponse } from './ts/ApiResponse.ts'
export type { Category } from './ts/Category.ts'
export type {
  CreatePetsBody,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsPathUuid,
  CreatePetsQueryOffset,
  CreatePetsRequestConfig,
  CreatePetsResponse,
  CreatePetsResponses,
  CreatePetsStatus201,
  CreatePetsStatusDefault,
  CreatePetsXEXAMPLEKey,
} from './ts/CreatePets.ts'
export type {
  DeleteOrderPathOrderId,
  DeleteOrderRequestConfig,
  DeleteOrderResponse,
  DeleteOrderResponses,
  DeleteOrderStatus400,
  DeleteOrderStatus404,
} from './ts/DeleteOrder.ts'
export type {
  DeletePetHeaderApiKey,
  DeletePetPathPetId,
  DeletePetRequestConfig,
  DeletePetResponse,
  DeletePetResponses,
  DeletePetStatus400,
} from './ts/DeletePet.ts'
export type {
  FindPetsByStatusQueryStatus,
  FindPetsByStatusRequestConfig,
  FindPetsByStatusResponse,
  FindPetsByStatusResponses,
  FindPetsByStatusStatus200,
  FindPetsByStatusStatus200Json,
  FindPetsByStatusStatus200Xml,
  FindPetsByStatusStatus400,
  FindPetsByStatusStatusKey,
} from './ts/FindPetsByStatus.ts'
export type {
  FindPetsByTagsHeaderXEXAMPLE,
  FindPetsByTagsQueryPage,
  FindPetsByTagsQueryPageSize,
  FindPetsByTagsQueryTags,
  FindPetsByTagsRequestConfig,
  FindPetsByTagsResponse,
  FindPetsByTagsResponses,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus200Json,
  FindPetsByTagsStatus200Xml,
  FindPetsByTagsStatus400,
  FindPetsByTagsXEXAMPLEKey,
} from './ts/FindPetsByTags.ts'
export type { GetInventoryRequestConfig, GetInventoryResponse, GetInventoryResponses, GetInventoryStatus200 } from './ts/GetInventory.ts'
export type {
  GetOrderByIdPathOrderId,
  GetOrderByIdRequestConfig,
  GetOrderByIdResponse,
  GetOrderByIdResponses,
  GetOrderByIdStatus200,
  GetOrderByIdStatus200Json,
  GetOrderByIdStatus200Xml,
  GetOrderByIdStatus400,
  GetOrderByIdStatus404,
} from './ts/GetOrderById.ts'
export type {
  GetPetByIdPathPetId,
  GetPetByIdRequestConfig,
  GetPetByIdResponse,
  GetPetByIdResponses,
  GetPetByIdStatus200,
  GetPetByIdStatus200Json,
  GetPetByIdStatus200Xml,
  GetPetByIdStatus400,
  GetPetByIdStatus404,
} from './ts/GetPetById.ts'
export type {
  GetThingsQueryLimit,
  GetThingsQuerySkip,
  GetThingsRequestConfig,
  GetThingsResponse,
  GetThingsResponses,
  GetThingsStatus201,
  GetThingsStatusDefault,
} from './ts/GetThings.ts'
export type { Order, OrderHttpStatusEnumKey, OrderStatusEnumKey, OrderValueEnumKey } from './ts/Order.ts'
export type { Pet, PetStatusEnumKey } from './ts/Pet.ts'
export type { PetNotFound } from './ts/PetNotFound.ts'
export type { PhoneNumber } from './ts/PhoneNumber.ts'
export type { PhoneWithMaxLength } from './ts/PhoneWithMaxLength.ts'
export type { PhoneWithMaxLengthExplicit } from './ts/PhoneWithMaxLengthExplicit.ts'
export type {
  PlaceOrderBody,
  PlaceOrderBodyFormUrlEncoded,
  PlaceOrderBodyJson,
  PlaceOrderBodyXml,
  PlaceOrderRequestConfig,
  PlaceOrderResponse,
  PlaceOrderResponses,
  PlaceOrderStatus200,
  PlaceOrderStatus405,
} from './ts/PlaceOrder.ts'
export type {
  PlaceOrderPatchBody,
  PlaceOrderPatchBodyFormUrlEncoded,
  PlaceOrderPatchBodyJson,
  PlaceOrderPatchBodyXml,
  PlaceOrderPatchRequestConfig,
  PlaceOrderPatchResponse,
  PlaceOrderPatchResponses,
  PlaceOrderPatchStatus200,
  PlaceOrderPatchStatus405,
} from './ts/PlaceOrderPatch.ts'
export type { Tag } from './ts/Tag.ts'
export type {
  UpdatePetBody,
  UpdatePetBodyFormUrlEncoded,
  UpdatePetBodyJson,
  UpdatePetBodyXml,
  UpdatePetRequestConfig,
  UpdatePetResponse,
  UpdatePetResponses,
  UpdatePetStatus200,
  UpdatePetStatus200Json,
  UpdatePetStatus200Xml,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from './ts/UpdatePet.ts'
export type {
  UpdatePetWithFormPathPetId,
  UpdatePetWithFormQueryName,
  UpdatePetWithFormQueryStatus,
  UpdatePetWithFormRequestConfig,
  UpdatePetWithFormResponse,
  UpdatePetWithFormResponses,
  UpdatePetWithFormStatus405,
} from './ts/UpdatePetWithForm.ts'
export type {
  UploadFileBody,
  UploadFilePathPetId,
  UploadFileQueryAdditionalMetadata,
  UploadFileRequestConfig,
  UploadFileResponse,
  UploadFileResponses,
  UploadFileStatus200,
} from './ts/UploadFile.ts'
export type { AddPetRequestSchemaType } from './zod/addPetRequestSchema.ts'
export type {
  AddPetBodySchemaFormUrlEncodedType,
  AddPetBodySchemaJsonType,
  AddPetBodySchemaType,
  AddPetBodySchemaXmlType,
  AddPetErrorSchemaType,
  AddPetResponseSchemaType,
  AddPetStatus200SchemaJsonType,
  AddPetStatus200SchemaType,
  AddPetStatus200SchemaXmlType,
  AddPetStatus405SchemaType,
} from './zod/addPetSchema.ts'
export type { ApiResponseSchemaType } from './zod/apiResponseSchema.ts'
export type { CategorySchemaType } from './zod/categorySchema.ts'
export type {
  CreatePetsBodySchemaType,
  CreatePetsErrorSchemaType,
  CreatePetsHeaderXEXAMPLESchemaType,
  CreatePetsPathUuidSchemaType,
  CreatePetsQueryOffsetSchemaType,
  CreatePetsResponseSchemaType,
  CreatePetsStatus201SchemaType,
  CreatePetsStatusDefaultSchemaType,
} from './zod/createPetsSchema.ts'
export type {
  DeleteOrderErrorSchemaType,
  DeleteOrderPathOrderIdSchemaType,
  DeleteOrderResponseSchemaType,
  DeleteOrderStatus400SchemaType,
  DeleteOrderStatus404SchemaType,
} from './zod/deleteOrderSchema.ts'
export type {
  DeletePetErrorSchemaType,
  DeletePetHeaderApiKeySchemaType,
  DeletePetPathPetIdSchemaType,
  DeletePetResponseSchemaType,
  DeletePetStatus400SchemaType,
} from './zod/deletePetSchema.ts'
export type {
  FindPetsByStatusErrorSchemaType,
  FindPetsByStatusQueryStatusSchemaType,
  FindPetsByStatusResponseSchemaType,
  FindPetsByStatusStatus200SchemaJsonType,
  FindPetsByStatusStatus200SchemaType,
  FindPetsByStatusStatus200SchemaXmlType,
  FindPetsByStatusStatus400SchemaType,
} from './zod/findPetsByStatusSchema.ts'
export type {
  FindPetsByTagsErrorSchemaType,
  FindPetsByTagsHeaderXEXAMPLESchemaType,
  FindPetsByTagsQueryPageSchemaType,
  FindPetsByTagsQueryPageSizeSchemaType,
  FindPetsByTagsQueryTagsSchemaType,
  FindPetsByTagsResponseSchemaType,
  FindPetsByTagsStatus200SchemaJsonType,
  FindPetsByTagsStatus200SchemaType,
  FindPetsByTagsStatus200SchemaXmlType,
  FindPetsByTagsStatus400SchemaType,
} from './zod/findPetsByTagsSchema.ts'
export type { GetInventoryResponseSchemaType, GetInventoryStatus200SchemaType } from './zod/getInventorySchema.ts'
export type {
  GetOrderByIdErrorSchemaType,
  GetOrderByIdPathOrderIdSchemaType,
  GetOrderByIdResponseSchemaType,
  GetOrderByIdStatus200SchemaJsonType,
  GetOrderByIdStatus200SchemaType,
  GetOrderByIdStatus200SchemaXmlType,
  GetOrderByIdStatus400SchemaType,
  GetOrderByIdStatus404SchemaType,
} from './zod/getOrderByIdSchema.ts'
export type {
  GetPetByIdErrorSchemaType,
  GetPetByIdPathPetIdSchemaType,
  GetPetByIdResponseSchemaType,
  GetPetByIdStatus200SchemaJsonType,
  GetPetByIdStatus200SchemaType,
  GetPetByIdStatus200SchemaXmlType,
  GetPetByIdStatus400SchemaType,
  GetPetByIdStatus404SchemaType,
} from './zod/getPetByIdSchema.ts'
export type {
  GetThingsErrorSchemaType,
  GetThingsQueryLimitSchemaType,
  GetThingsQuerySkipSchemaType,
  GetThingsResponseSchemaType,
  GetThingsStatus201SchemaType,
  GetThingsStatusDefaultSchemaType,
} from './zod/getThingsSchema.ts'
export type { OrderSchemaType } from './zod/orderSchema.ts'
export type { PetNotFoundSchemaType } from './zod/petNotFoundSchema.ts'
export type { PetSchemaType } from './zod/petSchema.ts'
export type { PhoneNumberSchemaType } from './zod/phoneNumberSchema.ts'
export type { PhoneWithMaxLengthExplicitSchemaType } from './zod/phoneWithMaxLengthExplicitSchema.ts'
export type { PhoneWithMaxLengthSchemaType } from './zod/phoneWithMaxLengthSchema.ts'
export type {
  PlaceOrderPatchBodySchemaFormUrlEncodedType,
  PlaceOrderPatchBodySchemaJsonType,
  PlaceOrderPatchBodySchemaType,
  PlaceOrderPatchBodySchemaXmlType,
  PlaceOrderPatchErrorSchemaType,
  PlaceOrderPatchResponseSchemaType,
  PlaceOrderPatchStatus200SchemaType,
  PlaceOrderPatchStatus405SchemaType,
} from './zod/placeOrderPatchSchema.ts'
export type {
  PlaceOrderBodySchemaFormUrlEncodedType,
  PlaceOrderBodySchemaJsonType,
  PlaceOrderBodySchemaType,
  PlaceOrderBodySchemaXmlType,
  PlaceOrderErrorSchemaType,
  PlaceOrderResponseSchemaType,
  PlaceOrderStatus200SchemaType,
  PlaceOrderStatus405SchemaType,
} from './zod/placeOrderSchema.ts'
export type { TagSchemaType } from './zod/tagSchema.ts'
export type {
  UpdatePetBodySchemaFormUrlEncodedType,
  UpdatePetBodySchemaJsonType,
  UpdatePetBodySchemaType,
  UpdatePetBodySchemaXmlType,
  UpdatePetErrorSchemaType,
  UpdatePetResponseSchemaType,
  UpdatePetStatus200SchemaJsonType,
  UpdatePetStatus200SchemaType,
  UpdatePetStatus200SchemaXmlType,
  UpdatePetStatus400SchemaType,
  UpdatePetStatus404SchemaType,
  UpdatePetStatus405SchemaType,
} from './zod/updatePetSchema.ts'
export type {
  UpdatePetWithFormErrorSchemaType,
  UpdatePetWithFormPathPetIdSchemaType,
  UpdatePetWithFormQueryNameSchemaType,
  UpdatePetWithFormQueryStatusSchemaType,
  UpdatePetWithFormResponseSchemaType,
  UpdatePetWithFormStatus405SchemaType,
} from './zod/updatePetWithFormSchema.ts'
export type {
  UploadFileBodySchemaType,
  UploadFilePathPetIdSchemaType,
  UploadFileQueryAdditionalMetadataSchemaType,
  UploadFileResponseSchemaType,
  UploadFileStatus200SchemaType,
} from './zod/uploadFileSchema.ts'
export { addPetRequestStatusEnum } from './ts/AddPetRequest.ts'
export { createPetsXEXAMPLE } from './ts/CreatePets.ts'
export { findPetsByStatusStatus } from './ts/FindPetsByStatus.ts'
export { findPetsByTagsXEXAMPLE } from './ts/FindPetsByTags.ts'
export { orderHttpStatusEnum, orderStatusEnum, orderValueEnum } from './ts/Order.ts'
export { petStatusEnum } from './ts/Pet.ts'
export { addPetRequestSchema } from './zod/addPetRequestSchema.ts'
export {
  addPetBodySchema,
  addPetBodySchemaFormUrlEncoded,
  addPetBodySchemaJson,
  addPetBodySchemaXml,
  addPetErrorSchema,
  addPetResponseSchema,
  addPetStatus200Schema,
  addPetStatus200SchemaJson,
  addPetStatus200SchemaXml,
  addPetStatus405Schema,
} from './zod/addPetSchema.ts'
export { apiResponseSchema } from './zod/apiResponseSchema.ts'
export { categorySchema } from './zod/categorySchema.ts'
export {
  createPetsBodySchema,
  createPetsErrorSchema,
  createPetsHeaderXEXAMPLESchema,
  createPetsPathUuidSchema,
  createPetsQueryOffsetSchema,
  createPetsResponseSchema,
  createPetsStatus201Schema,
  createPetsStatusDefaultSchema,
} from './zod/createPetsSchema.ts'
export {
  deleteOrderErrorSchema,
  deleteOrderPathOrderIdSchema,
  deleteOrderResponseSchema,
  deleteOrderStatus400Schema,
  deleteOrderStatus404Schema,
} from './zod/deleteOrderSchema.ts'
export {
  deletePetErrorSchema,
  deletePetHeaderApiKeySchema,
  deletePetPathPetIdSchema,
  deletePetResponseSchema,
  deletePetStatus400Schema,
} from './zod/deletePetSchema.ts'
export {
  findPetsByStatusErrorSchema,
  findPetsByStatusQueryStatusSchema,
  findPetsByStatusResponseSchema,
  findPetsByStatusStatus200Schema,
  findPetsByStatusStatus200SchemaJson,
  findPetsByStatusStatus200SchemaXml,
  findPetsByStatusStatus400Schema,
} from './zod/findPetsByStatusSchema.ts'
export {
  findPetsByTagsErrorSchema,
  findPetsByTagsHeaderXEXAMPLESchema,
  findPetsByTagsQueryPageSchema,
  findPetsByTagsQueryPageSizeSchema,
  findPetsByTagsQueryTagsSchema,
  findPetsByTagsResponseSchema,
  findPetsByTagsStatus200Schema,
  findPetsByTagsStatus200SchemaJson,
  findPetsByTagsStatus200SchemaXml,
  findPetsByTagsStatus400Schema,
} from './zod/findPetsByTagsSchema.ts'
export { getInventoryResponseSchema, getInventoryStatus200Schema } from './zod/getInventorySchema.ts'
export {
  getOrderByIdErrorSchema,
  getOrderByIdPathOrderIdSchema,
  getOrderByIdResponseSchema,
  getOrderByIdStatus200Schema,
  getOrderByIdStatus200SchemaJson,
  getOrderByIdStatus200SchemaXml,
  getOrderByIdStatus400Schema,
  getOrderByIdStatus404Schema,
} from './zod/getOrderByIdSchema.ts'
export {
  getPetByIdErrorSchema,
  getPetByIdPathPetIdSchema,
  getPetByIdResponseSchema,
  getPetByIdStatus200Schema,
  getPetByIdStatus200SchemaJson,
  getPetByIdStatus200SchemaXml,
  getPetByIdStatus400Schema,
  getPetByIdStatus404Schema,
} from './zod/getPetByIdSchema.ts'
export {
  getThingsErrorSchema,
  getThingsQueryLimitSchema,
  getThingsQuerySkipSchema,
  getThingsResponseSchema,
  getThingsStatus201Schema,
  getThingsStatusDefaultSchema,
} from './zod/getThingsSchema.ts'
export { OperationSchema, OperationsMap, operations, paths } from './zod/operations.ts'
export { orderSchema } from './zod/orderSchema.ts'
export { petNotFoundSchema } from './zod/petNotFoundSchema.ts'
export { petSchema } from './zod/petSchema.ts'
export { phoneNumberSchema } from './zod/phoneNumberSchema.ts'
export { phoneWithMaxLengthExplicitSchema } from './zod/phoneWithMaxLengthExplicitSchema.ts'
export { phoneWithMaxLengthSchema } from './zod/phoneWithMaxLengthSchema.ts'
export {
  placeOrderPatchBodySchema,
  placeOrderPatchBodySchemaFormUrlEncoded,
  placeOrderPatchBodySchemaJson,
  placeOrderPatchBodySchemaXml,
  placeOrderPatchErrorSchema,
  placeOrderPatchResponseSchema,
  placeOrderPatchStatus200Schema,
  placeOrderPatchStatus405Schema,
} from './zod/placeOrderPatchSchema.ts'
export {
  placeOrderBodySchema,
  placeOrderBodySchemaFormUrlEncoded,
  placeOrderBodySchemaJson,
  placeOrderBodySchemaXml,
  placeOrderErrorSchema,
  placeOrderResponseSchema,
  placeOrderStatus200Schema,
  placeOrderStatus405Schema,
} from './zod/placeOrderSchema.ts'
export { tagSchema } from './zod/tagSchema.ts'
export {
  updatePetBodySchema,
  updatePetBodySchemaFormUrlEncoded,
  updatePetBodySchemaJson,
  updatePetBodySchemaXml,
  updatePetErrorSchema,
  updatePetResponseSchema,
  updatePetStatus200Schema,
  updatePetStatus200SchemaJson,
  updatePetStatus200SchemaXml,
  updatePetStatus400Schema,
  updatePetStatus404Schema,
  updatePetStatus405Schema,
} from './zod/updatePetSchema.ts'
export {
  updatePetWithFormErrorSchema,
  updatePetWithFormPathPetIdSchema,
  updatePetWithFormQueryNameSchema,
  updatePetWithFormQueryStatusSchema,
  updatePetWithFormResponseSchema,
  updatePetWithFormStatus405Schema,
} from './zod/updatePetWithFormSchema.ts'
export {
  uploadFileBodySchema,
  uploadFilePathPetIdSchema,
  uploadFileQueryAdditionalMetadataSchema,
  uploadFileResponseSchema,
  uploadFileStatus200Schema,
} from './zod/uploadFileSchema.ts'
