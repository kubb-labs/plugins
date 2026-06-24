export type {
  AddPetData,
  AddPetFormUrlEncodedData,
  AddPetJsonData,
  AddPetRequestConfig,
  AddPetResponse,
  AddPetResponses,
  AddPetStatus200,
  AddPetStatus200Json,
  AddPetStatus200Xml,
  AddPetStatus405,
  AddPetXmlData,
} from './ts/AddPet.ts'
export type { AddPetRequest, AddPetRequestStatusEnumKey } from './ts/AddPetRequest.ts'
export type { ApiResponse } from './ts/ApiResponse.ts'
export type { Category } from './ts/Category.ts'
export type {
  CreatePetsData,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsPathUuid,
  CreatePetsQueryOffset,
  CreatePetsRequestConfig,
  CreatePetsResponse,
  CreatePetsResponses,
  CreatePetsStatus201,
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
} from './ts/GetThings.ts'
export type { Order, OrderHttpStatusEnumKey, OrderStatusEnumKey, OrderValueEnumKey } from './ts/Order.ts'
export type { Pet, PetStatusEnumKey } from './ts/Pet.ts'
export type { PetNotFound } from './ts/PetNotFound.ts'
export type { PhoneNumber } from './ts/PhoneNumber.ts'
export type { PhoneWithMaxLength } from './ts/PhoneWithMaxLength.ts'
export type { PhoneWithMaxLengthExplicit } from './ts/PhoneWithMaxLengthExplicit.ts'
export type {
  PlaceOrderData,
  PlaceOrderFormUrlEncodedData,
  PlaceOrderJsonData,
  PlaceOrderRequestConfig,
  PlaceOrderResponse,
  PlaceOrderResponses,
  PlaceOrderStatus405,
  PlaceOrderXmlData,
} from './ts/PlaceOrder.ts'
export type {
  PlaceOrderPatchData,
  PlaceOrderPatchFormUrlEncodedData,
  PlaceOrderPatchJsonData,
  PlaceOrderPatchRequestConfig,
  PlaceOrderPatchResponse,
  PlaceOrderPatchResponses,
  PlaceOrderPatchStatus405,
  PlaceOrderPatchXmlData,
} from './ts/PlaceOrderPatch.ts'
export type { Tag } from './ts/Tag.ts'
export type {
  UpdatePetData,
  UpdatePetFormUrlEncodedData,
  UpdatePetJsonData,
  UpdatePetRequestConfig,
  UpdatePetResponse,
  UpdatePetResponses,
  UpdatePetStatus200,
  UpdatePetStatus200Json,
  UpdatePetStatus200Xml,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
  UpdatePetXmlData,
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
export type { UploadFileData, UploadFilePathPetId, UploadFileQueryAdditionalMetadata, UploadFileRequestConfig, UploadFileResponses } from './ts/UploadFile.ts'
export type { AddPetRequestSchemaType } from './zod/addPetRequestSchema.ts'
export type {
  AddPetDataSchemaFormUrlEncodedType,
  AddPetDataSchemaJsonType,
  AddPetDataSchemaType,
  AddPetDataSchemaXmlType,
  AddPetResponseSchemaType,
  AddPetStatus200SchemaJsonType,
  AddPetStatus200SchemaType,
  AddPetStatus200SchemaXmlType,
  AddPetStatus405SchemaType,
} from './zod/addPetSchema.ts'
export type { ApiResponseSchemaType } from './zod/apiResponseSchema.ts'
export type { CategorySchemaType } from './zod/categorySchema.ts'
export type {
  CreatePetsDataSchemaType,
  CreatePetsHeaderXEXAMPLESchemaType,
  CreatePetsPathUuidSchemaType,
  CreatePetsQueryOffsetSchemaType,
  CreatePetsResponseSchemaType,
  CreatePetsStatus201SchemaType,
  CreatePetsStatusDefaultSchemaType,
} from './zod/createPetsSchema.ts'
export type {
  DeleteOrderPathOrderIdSchemaType,
  DeleteOrderResponseSchemaType,
  DeleteOrderStatus400SchemaType,
  DeleteOrderStatus404SchemaType,
} from './zod/deleteOrderSchema.ts'
export type {
  DeletePetHeaderApiKeySchemaType,
  DeletePetPathPetIdSchemaType,
  DeletePetResponseSchemaType,
  DeletePetStatus400SchemaType,
} from './zod/deletePetSchema.ts'
export type {
  FindPetsByStatusQueryStatusSchemaType,
  FindPetsByStatusResponseSchemaType,
  FindPetsByStatusStatus200SchemaJsonType,
  FindPetsByStatusStatus200SchemaType,
  FindPetsByStatusStatus200SchemaXmlType,
  FindPetsByStatusStatus400SchemaType,
} from './zod/findPetsByStatusSchema.ts'
export type {
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
  GetOrderByIdPathOrderIdSchemaType,
  GetOrderByIdResponseSchemaType,
  GetOrderByIdStatus200SchemaJsonType,
  GetOrderByIdStatus200SchemaType,
  GetOrderByIdStatus200SchemaXmlType,
  GetOrderByIdStatus400SchemaType,
  GetOrderByIdStatus404SchemaType,
} from './zod/getOrderByIdSchema.ts'
export type {
  GetPetByIdPathPetIdSchemaType,
  GetPetByIdResponseSchemaType,
  GetPetByIdStatus200SchemaJsonType,
  GetPetByIdStatus200SchemaType,
  GetPetByIdStatus200SchemaXmlType,
  GetPetByIdStatus400SchemaType,
  GetPetByIdStatus404SchemaType,
} from './zod/getPetByIdSchema.ts'
export type {
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
  PlaceOrderPatchDataSchemaFormUrlEncodedType,
  PlaceOrderPatchDataSchemaJsonType,
  PlaceOrderPatchDataSchemaType,
  PlaceOrderPatchDataSchemaXmlType,
  PlaceOrderPatchResponseSchemaType,
  PlaceOrderPatchStatus200SchemaType,
  PlaceOrderPatchStatus405SchemaType,
} from './zod/placeOrderPatchSchema.ts'
export type {
  PlaceOrderDataSchemaFormUrlEncodedType,
  PlaceOrderDataSchemaJsonType,
  PlaceOrderDataSchemaType,
  PlaceOrderDataSchemaXmlType,
  PlaceOrderResponseSchemaType,
  PlaceOrderStatus200SchemaType,
  PlaceOrderStatus405SchemaType,
} from './zod/placeOrderSchema.ts'
export type { TagSchemaType } from './zod/tagSchema.ts'
export type {
  UpdatePetDataSchemaFormUrlEncodedType,
  UpdatePetDataSchemaJsonType,
  UpdatePetDataSchemaType,
  UpdatePetDataSchemaXmlType,
  UpdatePetResponseSchemaType,
  UpdatePetStatus200SchemaJsonType,
  UpdatePetStatus200SchemaType,
  UpdatePetStatus200SchemaXmlType,
  UpdatePetStatus400SchemaType,
  UpdatePetStatus404SchemaType,
  UpdatePetStatus405SchemaType,
} from './zod/updatePetSchema.ts'
export type {
  UpdatePetWithFormPathPetIdSchemaType,
  UpdatePetWithFormQueryNameSchemaType,
  UpdatePetWithFormQueryStatusSchemaType,
  UpdatePetWithFormResponseSchemaType,
  UpdatePetWithFormStatus405SchemaType,
} from './zod/updatePetWithFormSchema.ts'
export type {
  UploadFileDataSchemaType,
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
  addPetDataSchema,
  addPetDataSchemaFormUrlEncoded,
  addPetDataSchemaJson,
  addPetDataSchemaXml,
  addPetResponseSchema,
  addPetStatus200Schema,
  addPetStatus200SchemaJson,
  addPetStatus200SchemaXml,
  addPetStatus405Schema,
} from './zod/addPetSchema.ts'
export { apiResponseSchema } from './zod/apiResponseSchema.ts'
export { categorySchema } from './zod/categorySchema.ts'
export {
  createPetsDataSchema,
  createPetsHeaderXEXAMPLESchema,
  createPetsPathUuidSchema,
  createPetsQueryOffsetSchema,
  createPetsResponseSchema,
  createPetsStatus201Schema,
  createPetsStatusDefaultSchema,
} from './zod/createPetsSchema.ts'
export { deleteOrderPathOrderIdSchema, deleteOrderResponseSchema, deleteOrderStatus400Schema, deleteOrderStatus404Schema } from './zod/deleteOrderSchema.ts'
export { deletePetHeaderApiKeySchema, deletePetPathPetIdSchema, deletePetResponseSchema, deletePetStatus400Schema } from './zod/deletePetSchema.ts'
export {
  findPetsByStatusQueryStatusSchema,
  findPetsByStatusResponseSchema,
  findPetsByStatusStatus200Schema,
  findPetsByStatusStatus200SchemaJson,
  findPetsByStatusStatus200SchemaXml,
  findPetsByStatusStatus400Schema,
} from './zod/findPetsByStatusSchema.ts'
export {
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
  getOrderByIdPathOrderIdSchema,
  getOrderByIdResponseSchema,
  getOrderByIdStatus200Schema,
  getOrderByIdStatus200SchemaJson,
  getOrderByIdStatus200SchemaXml,
  getOrderByIdStatus400Schema,
  getOrderByIdStatus404Schema,
} from './zod/getOrderByIdSchema.ts'
export {
  getPetByIdPathPetIdSchema,
  getPetByIdResponseSchema,
  getPetByIdStatus200Schema,
  getPetByIdStatus200SchemaJson,
  getPetByIdStatus200SchemaXml,
  getPetByIdStatus400Schema,
  getPetByIdStatus404Schema,
} from './zod/getPetByIdSchema.ts'
export {
  getThingsQueryLimitSchema,
  getThingsQuerySkipSchema,
  getThingsResponseSchema,
  getThingsStatus201Schema,
  getThingsStatusDefaultSchema,
} from './zod/getThingsSchema.ts'
export { OperationSchema, OperationsMap, operations, paths } from './zod/operationsSchema.ts'
export { orderSchema } from './zod/orderSchema.ts'
export { petNotFoundSchema } from './zod/petNotFoundSchema.ts'
export { petSchema } from './zod/petSchema.ts'
export { phoneNumberSchema } from './zod/phoneNumberSchema.ts'
export { phoneWithMaxLengthExplicitSchema } from './zod/phoneWithMaxLengthExplicitSchema.ts'
export { phoneWithMaxLengthSchema } from './zod/phoneWithMaxLengthSchema.ts'
export {
  placeOrderPatchDataSchema,
  placeOrderPatchDataSchemaFormUrlEncoded,
  placeOrderPatchDataSchemaJson,
  placeOrderPatchDataSchemaXml,
  placeOrderPatchResponseSchema,
  placeOrderPatchStatus200Schema,
  placeOrderPatchStatus405Schema,
} from './zod/placeOrderPatchSchema.ts'
export {
  placeOrderDataSchema,
  placeOrderDataSchemaFormUrlEncoded,
  placeOrderDataSchemaJson,
  placeOrderDataSchemaXml,
  placeOrderResponseSchema,
  placeOrderStatus200Schema,
  placeOrderStatus405Schema,
} from './zod/placeOrderSchema.ts'
export { tagSchema } from './zod/tagSchema.ts'
export {
  updatePetDataSchema,
  updatePetDataSchemaFormUrlEncoded,
  updatePetDataSchemaJson,
  updatePetDataSchemaXml,
  updatePetResponseSchema,
  updatePetStatus200Schema,
  updatePetStatus200SchemaJson,
  updatePetStatus200SchemaXml,
  updatePetStatus400Schema,
  updatePetStatus404Schema,
  updatePetStatus405Schema,
} from './zod/updatePetSchema.ts'
export {
  updatePetWithFormPathPetIdSchema,
  updatePetWithFormQueryNameSchema,
  updatePetWithFormQueryStatusSchema,
  updatePetWithFormResponseSchema,
  updatePetWithFormStatus405Schema,
} from './zod/updatePetWithFormSchema.ts'
export {
  uploadFileDataSchema,
  uploadFilePathPetIdSchema,
  uploadFileQueryAdditionalMetadataSchema,
  uploadFileResponseSchema,
  uploadFileStatus200Schema,
} from './zod/uploadFileSchema.ts'
