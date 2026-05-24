export type { AddPetRequest, AddPetRequestStatusEnumKey } from './AddPetRequest.ts'
export type { Address } from './Address.ts'
export type { Animal, AnimalTypeEnumKey } from './Animal.ts'
export type { ApiResponse } from './ApiResponse.ts'
export type { Cat } from './Cat.ts'
export type { Category } from './Category.ts'
export type { Customer, CustomerParamsStatusEnumKey } from './Customer.ts'
export type { Dog } from './Dog.ts'
export type { Image } from './Image.ts'
export type { Order, OrderHttpStatusEnumKey, OrderOrderTypeEnumKey, OrderParamsStatusEnumKey, OrderStatusEnumKey } from './Order.ts'
export type { Pet, PetStatusEnumKey } from './Pet.ts'
export type { PetNotFound } from './PetNotFound.ts'
export type { User } from './User.ts'
export type { UserArray } from './UserArray.ts'
export type {
  AddFilesData,
  AddFilesFormData,
  AddFilesJsonData,
  AddFilesRequestConfig,
  AddFilesResponse,
  AddFilesResponses,
  AddFilesStatus200,
  AddFilesStatus405,
} from './petController/AddFiles.ts'
export type {
  AddPetData,
  AddPetFormUrlEncodedData,
  AddPetJsonData,
  AddPetRequestConfig,
  AddPetResponse,
  AddPetResponses,
  AddPetStatus405,
  AddPetStatusDefault,
  AddPetStatusDefaultJson,
  AddPetStatusDefaultXml,
  AddPetXmlData,
} from './petController/AddPet.ts'
export type {
  DeletePetHeaderApiKey,
  DeletePetPathPetId,
  DeletePetRequestConfig,
  DeletePetResponse,
  DeletePetResponses,
  DeletePetStatus400,
} from './petController/DeletePet.ts'
export type {
  FindPetsByStatusPathStepId,
  FindPetsByStatusRequestConfig,
  FindPetsByStatusResponse,
  FindPetsByStatusResponses,
  FindPetsByStatusStatus200,
  FindPetsByStatusStatus200Json,
  FindPetsByStatusStatus200Xml,
  FindPetsByStatusStatus400,
} from './petController/FindPetsByStatus.ts'
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
} from './petController/FindPetsByTags.ts'
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
} from './petController/GetPetById.ts'
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
  UpdatePetStatus202,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
  UpdatePetXmlData,
} from './petController/UpdatePet.ts'
export type {
  UpdatePetWithFormPathPetId,
  UpdatePetWithFormQueryName,
  UpdatePetWithFormQueryStatus,
  UpdatePetWithFormRequestConfig,
  UpdatePetWithFormResponse,
  UpdatePetWithFormResponses,
  UpdatePetWithFormStatus405,
} from './petController/UpdatePetWithForm.ts'
export type {
  UploadFileData,
  UploadFilePathPetId,
  UploadFileQueryAdditionalMetadata,
  UploadFileRequestConfig,
  UploadFileResponse,
  UploadFileResponses,
  UploadFileStatus200,
} from './petController/UploadFile.ts'
export type {
  CreatePetsBoolParamKey,
  CreatePetsData,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsPathUuid,
  CreatePetsQueryBoolParam,
  CreatePetsQueryOffset,
  CreatePetsRequestConfig,
  CreatePetsResponse,
  CreatePetsResponses,
  CreatePetsStatus201,
  CreatePetsStatusDefault,
  CreatePetsXEXAMPLEKey,
} from './petsController/CreatePets.ts'
export type {
  DeleteOrderPathOrderId,
  DeleteOrderRequestConfig,
  DeleteOrderResponse,
  DeleteOrderResponses,
  DeleteOrderStatus400,
  DeleteOrderStatus404,
} from './storeController/DeleteOrder.ts'
export type { GetInventoryRequestConfig, GetInventoryResponse, GetInventoryResponses, GetInventoryStatus200 } from './storeController/GetInventory.ts'
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
} from './storeController/GetOrderById.ts'
export type {
  PlaceOrderData,
  PlaceOrderFormUrlEncodedData,
  PlaceOrderJsonData,
  PlaceOrderRequestConfig,
  PlaceOrderResponse,
  PlaceOrderResponses,
  PlaceOrderStatus200,
  PlaceOrderStatus405,
  PlaceOrderXmlData,
} from './storeController/PlaceOrder.ts'
export type {
  PlaceOrderPatchData,
  PlaceOrderPatchFormUrlEncodedData,
  PlaceOrderPatchJsonData,
  PlaceOrderPatchRequestConfig,
  PlaceOrderPatchResponse,
  PlaceOrderPatchResponses,
  PlaceOrderPatchStatus200,
  PlaceOrderPatchStatus405,
  PlaceOrderPatchXmlData,
} from './storeController/PlaceOrderPatch.ts'
export type { TagTag } from './tag/Tag.ts'
export type {
  CreateUserData,
  CreateUserFormUrlEncodedData,
  CreateUserJsonData,
  CreateUserRequestConfig,
  CreateUserResponse,
  CreateUserResponses,
  CreateUserStatusDefault,
  CreateUserStatusDefaultJson,
  CreateUserStatusDefaultXml,
  CreateUserXmlData,
} from './userController/CreateUser.ts'
export type {
  CreateUsersWithListInputData,
  CreateUsersWithListInputRequestConfig,
  CreateUsersWithListInputResponse,
  CreateUsersWithListInputResponses,
  CreateUsersWithListInputStatus200,
  CreateUsersWithListInputStatus200Json,
  CreateUsersWithListInputStatus200Xml,
  CreateUsersWithListInputStatusDefault,
} from './userController/CreateUsersWithListInput.ts'
export type {
  DeleteUserPathUsername,
  DeleteUserRequestConfig,
  DeleteUserResponse,
  DeleteUserResponses,
  DeleteUserStatus400,
  DeleteUserStatus404,
} from './userController/DeleteUser.ts'
export type {
  GetUserByNamePathUsername,
  GetUserByNameRequestConfig,
  GetUserByNameResponse,
  GetUserByNameResponses,
  GetUserByNameStatus200,
  GetUserByNameStatus200Json,
  GetUserByNameStatus200Xml,
  GetUserByNameStatus400,
  GetUserByNameStatus404,
} from './userController/GetUserByName.ts'
export type {
  LoginUserQueryPassword,
  LoginUserQueryUsername,
  LoginUserRequestConfig,
  LoginUserResponse,
  LoginUserResponses,
  LoginUserStatus200,
  LoginUserStatus200Json,
  LoginUserStatus200Xml,
  LoginUserStatus400,
} from './userController/LoginUser.ts'
export type { LogoutUserRequestConfig, LogoutUserResponse, LogoutUserResponses, LogoutUserStatusDefault } from './userController/LogoutUser.ts'
export type {
  UpdateUserData,
  UpdateUserFormUrlEncodedData,
  UpdateUserJsonData,
  UpdateUserPathUsername,
  UpdateUserRequestConfig,
  UpdateUserResponse,
  UpdateUserResponses,
  UpdateUserStatusDefault,
  UpdateUserXmlData,
} from './userController/UpdateUser.ts'
export { addPetRequestStatusEnum } from './AddPetRequest.ts'
export { animalTypeEnum } from './Animal.ts'
export { customerParamsStatusEnum } from './Customer.ts'
export { orderHttpStatusEnum, orderOrderTypeEnum, orderParamsStatusEnum, orderStatusEnum } from './Order.ts'
export { petStatusEnum } from './Pet.ts'
export { findPetsByTagsXEXAMPLE } from './petController/FindPetsByTags.ts'
export { createPetsBoolParam, createPetsXEXAMPLE } from './petsController/CreatePets.ts'
