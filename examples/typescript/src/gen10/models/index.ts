export type { AddPetRequest } from './AddPetRequest.ts'
export type { Address } from './Address.ts'
export type { ApiResponse } from './ApiResponse.ts'
export type { Cat } from './Cat.ts'
export type { Category } from './Category.ts'
export type { Customer } from './Customer.ts'
export type { Dog } from './Dog.ts'
export type { FullAddress } from './FullAddress.ts'
export type { HappyCustomer } from './HappyCustomer.ts'
export type { Order } from './Order.ts'
export type { Pet } from './Pet.ts'
export type { PetNotFound } from './PetNotFound.ts'
export type { Tag } from './Tag.ts'
export type { UnhappyCustomer } from './UnhappyCustomer.ts'
export type { User } from './User.ts'
export type { UserArray } from './UserArray.ts'
export type { AddPetStatus200, AddPetStatus405, AddPetData, AddPetRequestConfig, AddPetResponses, AddPetResponse } from './petController/AddPet.ts'
export type {
  DeletePetHeaderApiKey,
  DeletePetPathPetId,
  DeletePetStatus200,
  DeletePetStatus400,
  DeletePetRequestConfig,
  DeletePetResponses,
  DeletePetResponse,
} from './petController/DeletePet.ts'
export type {
  FindPetsByStatusQueryStatus,
  FindPetsByStatusStatus200,
  FindPetsByStatusStatus400,
  FindPetsByStatusRequestConfig,
  FindPetsByStatusResponses,
  FindPetsByStatusResponse,
} from './petController/FindPetsByStatus.ts'
export type {
  FindPetsByTagsQueryTags,
  FindPetsByTagsQueryPage,
  FindPetsByTagsQueryPageSize,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus400,
  FindPetsByTagsRequestConfig,
  FindPetsByTagsResponses,
  FindPetsByTagsResponse,
} from './petController/FindPetsByTags.ts'
export type {
  GetPetByIdPathPetId,
  GetPetByIdStatus200,
  GetPetByIdStatus400,
  GetPetByIdStatus404,
  GetPetByIdRequestConfig,
  GetPetByIdResponses,
  GetPetByIdResponse,
} from './petController/GetPetById.ts'
export type {
  UpdatePetStatus200,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
  UpdatePetData,
  UpdatePetRequestConfig,
  UpdatePetResponses,
  UpdatePetResponse,
} from './petController/UpdatePet.ts'
export type {
  UpdatePetWithFormPathPetId,
  UpdatePetWithFormQueryName,
  UpdatePetWithFormQueryStatus,
  UpdatePetWithFormStatus405,
  UpdatePetWithFormRequestConfig,
  UpdatePetWithFormResponses,
  UpdatePetWithFormResponse,
} from './petController/UpdatePetWithForm.ts'
export type {
  UploadFilePathPetId,
  UploadFileQueryAdditionalMetadata,
  UploadFileStatus200,
  UploadFileData,
  UploadFileRequestConfig,
  UploadFileResponses,
  UploadFileResponse,
} from './petController/UploadFile.ts'
export type {
  DeleteOrderPathOrderId,
  DeleteOrderStatus400,
  DeleteOrderStatus404,
  DeleteOrderRequestConfig,
  DeleteOrderResponses,
  DeleteOrderResponse,
} from './storeController/DeleteOrder.ts'
export type { GetInventoryStatus200, GetInventoryRequestConfig, GetInventoryResponses, GetInventoryResponse } from './storeController/GetInventory.ts'
export type {
  GetOrderByIdPathOrderId,
  GetOrderByIdStatus200,
  GetOrderByIdStatus400,
  GetOrderByIdStatus404,
  GetOrderByIdRequestConfig,
  GetOrderByIdResponses,
  GetOrderByIdResponse,
} from './storeController/GetOrderById.ts'
export type {
  PlaceOrderStatus200,
  PlaceOrderStatus405,
  PlaceOrderData,
  PlaceOrderRequestConfig,
  PlaceOrderResponses,
  PlaceOrderResponse,
} from './storeController/PlaceOrder.ts'
export type {
  PlaceOrderPatchStatus200,
  PlaceOrderPatchStatus405,
  PlaceOrderPatchData,
  PlaceOrderPatchRequestConfig,
  PlaceOrderPatchResponses,
  PlaceOrderPatchResponse,
} from './storeController/PlaceOrderPatch.ts'
export type { CreateUserStatusDefault, CreateUserData, CreateUserRequestConfig, CreateUserResponses, CreateUserResponse } from './userController/CreateUser.ts'
export type {
  CreateUsersWithListInputStatus200,
  CreateUsersWithListInputStatusDefault,
  CreateUsersWithListInputData,
  CreateUsersWithListInputRequestConfig,
  CreateUsersWithListInputResponses,
  CreateUsersWithListInputResponse,
} from './userController/CreateUsersWithListInput.ts'
export type {
  DeleteUserPathUsername,
  DeleteUserStatus400,
  DeleteUserStatus404,
  DeleteUserRequestConfig,
  DeleteUserResponses,
  DeleteUserResponse,
} from './userController/DeleteUser.ts'
export type {
  GetUserByNamePathUsername,
  GetUserByNameStatus200,
  GetUserByNameStatus400,
  GetUserByNameStatus404,
  GetUserByNameRequestConfig,
  GetUserByNameResponses,
  GetUserByNameResponse,
} from './userController/GetUserByName.ts'
export type {
  LoginUserQueryUsername,
  LoginUserQueryPassword,
  LoginUserStatus200,
  LoginUserStatus400,
  LoginUserRequestConfig,
  LoginUserResponses,
  LoginUserResponse,
} from './userController/LoginUser.ts'
export type { LogoutUserStatusDefault, LogoutUserRequestConfig, LogoutUserResponses, LogoutUserResponse } from './userController/LogoutUser.ts'
export type {
  UpdateUserPathUsername,
  UpdateUserStatusDefault,
  UpdateUserData,
  UpdateUserRequestConfig,
  UpdateUserResponses,
  UpdateUserResponse,
} from './userController/UpdateUser.ts'
