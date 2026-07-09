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
} from './models/AddPet'
export type { ApiResponse } from './models/ApiResponse'
export type { Category } from './models/Category'
export type {
  DeleteOrderOptions,
  DeleteOrderPath,
  DeleteOrderResponse,
  DeleteOrderResponses,
  DeleteOrderStatus400,
  DeleteOrderStatus404,
} from './models/DeleteOrder'
export type { DeletePetHeaders, DeletePetOptions, DeletePetPath, DeletePetResponse, DeletePetResponses, DeletePetStatus400 } from './models/DeletePet'
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
} from './models/FindPetsByStatus'
export type {
  FindPetsByTagsOptions,
  FindPetsByTagsQuery,
  FindPetsByTagsResponse,
  FindPetsByTagsResponses,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus200Json,
  FindPetsByTagsStatus200Xml,
  FindPetsByTagsStatus400,
} from './models/FindPetsByTags'
export type { GetInventoryOptions, GetInventoryResponse, GetInventoryResponses, GetInventoryStatus200 } from './models/GetInventory'
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
} from './models/GetOrderById'
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
} from './models/GetPetById'
export type { Item } from './models/Item'
export type { Order, OrderStatusEnumKey } from './models/Order'
export type { Pet, PetStatusEnumKey } from './models/Pet'
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
} from './models/PlaceOrder'
export type { Tag } from './models/Tag'
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
} from './models/UpdatePet'
export type {
  UpdatePetWithFormOptions,
  UpdatePetWithFormPath,
  UpdatePetWithFormQuery,
  UpdatePetWithFormResponse,
  UpdatePetWithFormResponses,
  UpdatePetWithFormStatus405,
} from './models/UpdatePetWithForm'
export type {
  UploadFileBody,
  UploadFileOptions,
  UploadFilePath,
  UploadFileQuery,
  UploadFileResponse,
  UploadFileResponses,
  UploadFileStatus200,
} from './models/UploadFile'
export { createCategory } from './faker/createCategory'
export { createPet } from './faker/createPet'
export { createTag } from './faker/createTag'
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
} from './faker/createUpdatePet'
export {
  createUpdatePetWithFormPath,
  createUpdatePetWithFormQuery,
  createUpdatePetWithFormResponse,
  createUpdatePetWithFormStatus405,
} from './faker/createUpdatePetWithForm'
export { findPetsByStatusStatus } from './models/FindPetsByStatus'
export { orderStatusEnum } from './models/Order'
export { petStatusEnum } from './models/Pet'
