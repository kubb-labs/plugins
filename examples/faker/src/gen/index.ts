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
} from './models/addPet.ts'
export type { ApiResponse } from './models/apiResponse.ts'
export type { Category } from './models/category.ts'
export type {
  DeleteOrderPathOrderId,
  DeleteOrderRequestConfig,
  DeleteOrderResponse,
  DeleteOrderResponses,
  DeleteOrderStatus400,
  DeleteOrderStatus404,
} from './models/deleteOrder.ts'
export type {
  DeletePetHeaderApiKey,
  DeletePetPathPetId,
  DeletePetRequestConfig,
  DeletePetResponse,
  DeletePetResponses,
  DeletePetStatus400,
} from './models/deletePet.ts'
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
} from './models/findPetsByStatus.ts'
export type {
  FindPetsByTagsQueryTags,
  FindPetsByTagsRequestConfig,
  FindPetsByTagsResponse,
  FindPetsByTagsResponses,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus200Json,
  FindPetsByTagsStatus200Xml,
  FindPetsByTagsStatus400,
} from './models/findPetsByTags.ts'
export type { GetInventoryRequestConfig, GetInventoryResponse, GetInventoryResponses, GetInventoryStatus200 } from './models/getInventory.ts'
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
} from './models/getOrderById.ts'
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
} from './models/getPetById.ts'
export type { Item } from './models/item.ts'
export type { Order, OrderStatusEnumKey } from './models/order.ts'
export type { Pet, PetStatusEnumKey } from './models/pet.ts'
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
} from './models/placeOrder.ts'
export type { Tag } from './models/tag.ts'
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
} from './models/updatePet.ts'
export type {
  UpdatePetWithFormPathPetId,
  UpdatePetWithFormQueryName,
  UpdatePetWithFormQueryStatus,
  UpdatePetWithFormRequestConfig,
  UpdatePetWithFormResponse,
  UpdatePetWithFormResponses,
  UpdatePetWithFormStatus405,
} from './models/updatePetWithForm.ts'
export type {
  UploadFileBody,
  UploadFilePathPetId,
  UploadFileQueryAdditionalMetadata,
  UploadFileRequestConfig,
  UploadFileResponse,
  UploadFileResponses,
  UploadFileStatus200,
} from './models/uploadFile.ts'
export { createCategory } from './faker/category.ts'
export { createPet } from './faker/pet.ts'
export { createTag } from './faker/tag.ts'
export {
  createUpdatePetBody,
  createUpdatePetBodyFormUrlEncoded,
  createUpdatePetBodyJson,
  createUpdatePetBodyXml,
  createUpdatePetResponse,
  createUpdatePetStatus200,
  createUpdatePetStatus200Json,
  createUpdatePetStatus200Xml,
  createUpdatePetStatus400,
  createUpdatePetStatus404,
  createUpdatePetStatus405,
} from './faker/updatePet.ts'
export {
  createUpdatePetWithFormPathPetId,
  createUpdatePetWithFormQueryName,
  createUpdatePetWithFormQueryStatus,
  createUpdatePetWithFormResponse,
  createUpdatePetWithFormStatus405,
} from './faker/updatePetWithForm.ts'
export { findPetsByStatusStatus } from './models/findPetsByStatus.ts'
export { orderStatusEnum } from './models/order.ts'
export { petStatusEnum } from './models/pet.ts'
