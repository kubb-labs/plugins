export type { AddPetRequest } from './AddPetRequest.ts'
export type { AddPetRequestStatusEnum } from './AddPetRequestStatusEnum.ts'
export type { Address } from './Address.ts'
export type { ApiResponse } from './ApiResponse.ts'
export type { Cat } from './Cat.ts'
export type { Category } from './Category.ts'
export type { Customer } from './Customer.ts'
export type { CustomerParamsStatusEnum } from './CustomerParamsStatusEnum.ts'
export type { DeletePetStatus200Enum } from './DeletePetStatus200Enum.ts'
export type { Dog } from './Dog.ts'
export type { FindPetsByStatusStatus } from './FindPetsByStatusStatus.ts'
export type { FullAddress } from './FullAddress.ts'
export type { HappyCustomer } from './HappyCustomer.ts'
export type { Order } from './Order.ts'
export type { OrderHttpStatusEnum } from './OrderHttpStatusEnum.ts'
export type { OrderParamsStatusEnum } from './OrderParamsStatusEnum.ts'
export type { OrderStatus } from './OrderStatus.ts'
export type { Pet } from './Pet.ts'
export type { PetNotFound } from './PetNotFound.ts'
export type { PetStatusEnum } from './PetStatusEnum.ts'
export type { PetTypeEnum } from './PetTypeEnum.ts'
export type { Tag } from './Tag.ts'
export type { UnhappyCustomer } from './UnhappyCustomer.ts'
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
} from './pet/AddPet.ts'
export type {
  DeletePetHeaders,
  DeletePetOptions,
  DeletePetPath,
  DeletePetResponse,
  DeletePetResponses,
  DeletePetStatus200,
  DeletePetStatus400,
} from './pet/DeletePet.ts'
export type {
  FindPetsByStatusOptions,
  FindPetsByStatusQuery,
  FindPetsByStatusResponse,
  FindPetsByStatusResponses,
  FindPetsByStatusStatus200,
  FindPetsByStatusStatus200Json,
  FindPetsByStatusStatus200Xml,
  FindPetsByStatusStatus400,
} from './pet/FindPetsByStatus.ts'
export type {
  FindPetsByTagsOptions,
  FindPetsByTagsQuery,
  FindPetsByTagsResponse,
  FindPetsByTagsResponses,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus200Json,
  FindPetsByTagsStatus200Xml,
  FindPetsByTagsStatus400,
} from './pet/FindPetsByTags.ts'
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
} from './pet/GetPetById.ts'
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
} from './pet/UpdatePet.ts'
export type {
  UpdatePetWithFormOptions,
  UpdatePetWithFormPath,
  UpdatePetWithFormQuery,
  UpdatePetWithFormResponse,
  UpdatePetWithFormResponses,
  UpdatePetWithFormStatus405,
} from './pet/UpdatePetWithForm.ts'
export type {
  UploadFileBody,
  UploadFileOptions,
  UploadFilePath,
  UploadFileQuery,
  UploadFileResponse,
  UploadFileResponses,
  UploadFileStatus200,
} from './pet/UploadFile.ts'
export type {
  DeleteOrderOptions,
  DeleteOrderPath,
  DeleteOrderResponse,
  DeleteOrderResponses,
  DeleteOrderStatus400,
  DeleteOrderStatus404,
} from './store/DeleteOrder.ts'
export type { GetInventoryOptions, GetInventoryResponse, GetInventoryResponses, GetInventoryStatus200 } from './store/GetInventory.ts'
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
} from './store/GetOrderById.ts'
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
} from './store/PlaceOrder.ts'
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
} from './store/PlaceOrderPatch.ts'
