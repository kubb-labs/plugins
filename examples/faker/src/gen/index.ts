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
} from './models/AddPet.ts'
export type { ApiResponse } from './models/ApiResponse.ts'
export type { Category } from './models/Category.ts'
export type {
  DeleteOrderPathOrderId,
  DeleteOrderRequestConfig,
  DeleteOrderResponse,
  DeleteOrderResponses,
  DeleteOrderStatus400,
  DeleteOrderStatus404,
} from './models/DeleteOrder.ts'
export type {
  DeletePetHeaderApiKey,
  DeletePetPathPetId,
  DeletePetRequestConfig,
  DeletePetResponse,
  DeletePetResponses,
  DeletePetStatus400,
} from './models/DeletePet.ts'
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
} from './models/FindPetsByStatus.ts'
export type {
  FindPetsByTagsQueryTags,
  FindPetsByTagsRequestConfig,
  FindPetsByTagsResponse,
  FindPetsByTagsResponses,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus200Json,
  FindPetsByTagsStatus200Xml,
  FindPetsByTagsStatus400,
} from './models/FindPetsByTags.ts'
export type { GetInventoryRequestConfig, GetInventoryResponse, GetInventoryResponses, GetInventoryStatus200 } from './models/GetInventory.ts'
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
} from './models/GetOrderById.ts'
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
} from './models/GetPetById.ts'
export type { Item } from './models/Item.ts'
export type { Order, OrderStatusEnumKey } from './models/Order.ts'
export type { Pet, PetStatusEnumKey } from './models/Pet.ts'
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
} from './models/PlaceOrder.ts'
export type { Tag } from './models/Tag.ts'
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
} from './models/UpdatePet.ts'
export type {
  UpdatePetWithFormPathPetId,
  UpdatePetWithFormQueryName,
  UpdatePetWithFormQueryStatus,
  UpdatePetWithFormRequestConfig,
  UpdatePetWithFormResponse,
  UpdatePetWithFormResponses,
  UpdatePetWithFormStatus405,
} from './models/UpdatePetWithForm.ts'
export type {
  UploadFileBody,
  UploadFilePathPetId,
  UploadFileQueryAdditionalMetadata,
  UploadFileRequestConfig,
  UploadFileResponse,
  UploadFileResponses,
  UploadFileStatus200,
} from './models/UploadFile.ts'
export { createCategory } from './faker/createCategory.ts'
export { createPet } from './faker/createPet.ts'
export { createTag } from './faker/createTag.ts'
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
} from './faker/createUpdatePet.ts'
export {
  createUpdatePetWithFormPathPetId,
  createUpdatePetWithFormQueryName,
  createUpdatePetWithFormQueryStatus,
  createUpdatePetWithFormResponse,
  createUpdatePetWithFormStatus405,
} from './faker/createUpdatePetWithForm.ts'
export { findPetsByStatusStatus } from './models/FindPetsByStatus.ts'
export { orderStatusEnum } from './models/Order.ts'
export { petStatusEnum } from './models/Pet.ts'
