import { addFilesHandler } from './petRequests/addFiles.ts'
import { addPetHandler } from './petRequests/addPet.ts'
import { deletePetHandler } from './petRequests/deletePet.ts'
import { findPetsByStatusHandler } from './petRequests/findPetsByStatus.ts'
import { findPetsByTagsHandler } from './petRequests/findPetsByTags.ts'
import { getPetByIdHandler } from './petRequests/getPetById.ts'
import { updatePetHandler } from './petRequests/updatePet.ts'
import { updatePetWithFormHandler } from './petRequests/updatePetWithForm.ts'
import { uploadFileHandler } from './petRequests/uploadFile.ts'
import { createPetsHandler } from './petsRequests/createPets.ts'
import { createUserHandler } from './userRequests/createUser.ts'
import { createUsersWithListInputHandler } from './userRequests/createUsersWithListInput.ts'
import { deleteUserHandler } from './userRequests/deleteUser.ts'
import { getUserByNameHandler } from './userRequests/getUserByName.ts'
import { loginUserHandler } from './userRequests/loginUser.ts'
import { logoutUserHandler } from './userRequests/logoutUser.ts'
import { updateUserHandler } from './userRequests/updateUser.ts'
import { addFilesDataSchema, addFilesStatus200Schema } from '../zod/petController/addFilesSchema.ts'
import { addPetDataSchema } from '../zod/petController/addPetSchema.ts'
import { deletePetHeaderApiKeySchema, deletePetPathPetIdSchema } from '../zod/petController/deletePetSchema.ts'
import { findPetsByStatusPathStepIdSchema, findPetsByStatusStatus200Schema } from '../zod/petController/findPetsByStatusSchema.ts'
import {
  findPetsByTagsHeaderXEXAMPLESchema,
  findPetsByTagsQueryPageSchema,
  findPetsByTagsQueryPageSizeSchema,
  findPetsByTagsQueryTagsSchema,
  findPetsByTagsStatus200Schema,
} from '../zod/petController/findPetsByTagsSchema.ts'
import { getPetByIdPathPetIdSchema, getPetByIdStatus200Schema } from '../zod/petController/getPetByIdSchema.ts'
import { updatePetDataSchema, updatePetStatus200Schema } from '../zod/petController/updatePetSchema.ts'
import {
  updatePetWithFormPathPetIdSchema,
  updatePetWithFormQueryNameSchema,
  updatePetWithFormQueryStatusSchema,
} from '../zod/petController/updatePetWithFormSchema.ts'
import {
  uploadFileDataSchema,
  uploadFilePathPetIdSchema,
  uploadFileQueryAdditionalMetadataSchema,
  uploadFileStatus200Schema,
} from '../zod/petController/uploadFileSchema.ts'
import {
  createPetsDataSchema,
  createPetsHeaderXEXAMPLESchema,
  createPetsPathUuidSchema,
  createPetsQueryBoolParamSchema,
  createPetsQueryOffsetSchema,
  createPetsStatus201Schema,
} from '../zod/petsController/createPetsSchema.ts'
import { createUserDataSchema } from '../zod/userController/createUserSchema.ts'
import { createUsersWithListInputDataSchema, createUsersWithListInputStatus200Schema } from '../zod/userController/createUsersWithListInputSchema.ts'
import { deleteUserPathUsernameSchema } from '../zod/userController/deleteUserSchema.ts'
import { getUserByNamePathUsernameSchema, getUserByNameStatus200Schema } from '../zod/userController/getUserByNameSchema.ts'
import { loginUserQueryPasswordSchema, loginUserQueryUsernameSchema, loginUserStatus200Schema } from '../zod/userController/loginUserSchema.ts'
import { updateUserDataSchema, updateUserPathUsernameSchema } from '../zod/userController/updateUserSchema.ts'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio'
import { z } from 'zod'

export const server = new McpServer({
  name: 'Swagger PetStore - OpenAPI 3.0',
  version: '1.0.11',
})

server.registerTool(
  'createPets',
  {
    title: 'Create a pet',
    description: 'Make a POST request to /pets/{uuid}',
    outputSchema: { data: createPetsStatus201Schema },
    inputSchema: {
      uuid: createPetsPathUuidSchema,
      data: createPetsDataSchema,
      headers: z.object({ xEXAMPLE: createPetsHeaderXEXAMPLESchema }),
      params: z.object({ boolParam: createPetsQueryBoolParamSchema, offset: createPetsQueryOffsetSchema }),
    },
  },
  async ({ uuid, data, headers, params }, request) => {
    return createPetsHandler({ uuid, data, headers, params }, request)
  },
)

server.registerTool(
  'updatePet',
  {
    title: 'Update an existing pet',
    description: 'Update an existing pet by Id',
    outputSchema: { data: updatePetStatus200Schema },
    inputSchema: { data: updatePetDataSchema },
  },
  async ({ data }, request) => {
    return updatePetHandler({ data }, request)
  },
)

server.registerTool(
  'addPet',
  {
    title: 'Add a new pet to the store',
    description: 'Add a new pet to the store',
    inputSchema: { data: addPetDataSchema },
  },
  async ({ data }, request) => {
    return addPetHandler({ data }, request)
  },
)

server.registerTool(
  'findPetsByStatus',
  {
    title: 'Finds Pets by status',
    description: 'Multiple status values can be provided with comma separated strings',
    outputSchema: { data: findPetsByStatusStatus200Schema },
    inputSchema: { stepId: findPetsByStatusPathStepIdSchema },
  },
  async ({ stepId }, request) => {
    return findPetsByStatusHandler({ stepId }, request)
  },
)

server.registerTool(
  'findPetsByTags',
  {
    title: 'Finds Pets by tags',
    description: 'Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.',
    outputSchema: { data: findPetsByTagsStatus200Schema },
    inputSchema: {
      headers: z.object({ xEXAMPLE: findPetsByTagsHeaderXEXAMPLESchema }),
      params: z.object({ tags: findPetsByTagsQueryTagsSchema, page: findPetsByTagsQueryPageSchema, pageSize: findPetsByTagsQueryPageSizeSchema }),
    },
  },
  async ({ headers, params }, request) => {
    return findPetsByTagsHandler({ headers, params }, request)
  },
)

server.registerTool(
  'getPetById',
  {
    title: 'Find pet by ID',
    description: 'Returns a single pet',
    outputSchema: { data: getPetByIdStatus200Schema },
    inputSchema: { petId: getPetByIdPathPetIdSchema },
  },
  async ({ petId }, request) => {
    return getPetByIdHandler({ petId }, request)
  },
)

server.registerTool(
  'updatePetWithForm',
  {
    title: 'Updates a pet in the store with form data',
    description: 'Make a POST request to /pet/{petId}:search',
    inputSchema: {
      petId: updatePetWithFormPathPetIdSchema,
      params: z.object({ name: updatePetWithFormQueryNameSchema, status: updatePetWithFormQueryStatusSchema }),
    },
  },
  async ({ petId, params }, request) => {
    return updatePetWithFormHandler({ petId, params }, request)
  },
)

server.registerTool(
  'deletePet',
  {
    title: 'Deletes a pet',
    description: 'delete a pet',
    inputSchema: { petId: deletePetPathPetIdSchema, headers: z.object({ apiKey: deletePetHeaderApiKeySchema }) },
  },
  async ({ petId, headers }, request) => {
    return deletePetHandler({ petId, headers }, request)
  },
)

server.registerTool(
  'addFiles',
  {
    title: 'Place an file for a pet',
    description: 'Place a new file in the store',
    outputSchema: { data: addFilesStatus200Schema },
    inputSchema: { data: addFilesDataSchema },
  },
  async ({ data }, request) => {
    return addFilesHandler({ data }, request)
  },
)

server.registerTool(
  'uploadFile',
  {
    title: 'uploads an image',
    description: 'Make a POST request to /pet/{petId}/uploadImage',
    outputSchema: { data: uploadFileStatus200Schema },
    inputSchema: {
      petId: uploadFilePathPetIdSchema,
      data: uploadFileDataSchema,
      params: z.object({ additionalMetadata: uploadFileQueryAdditionalMetadataSchema }),
    },
  },
  async ({ petId, data, params }, request) => {
    return uploadFileHandler({ petId, data, params }, request)
  },
)

server.registerTool(
  'createUser',
  {
    title: 'Create user',
    description: 'This can only be done by the logged in user.',
    inputSchema: { data: createUserDataSchema },
  },
  async ({ data }, request) => {
    return createUserHandler({ data }, request)
  },
)

server.registerTool(
  'createUsersWithListInput',
  {
    title: 'Creates list of users with given input array',
    description: 'Creates list of users with given input array',
    outputSchema: { data: createUsersWithListInputStatus200Schema },
    inputSchema: { data: createUsersWithListInputDataSchema },
  },
  async ({ data }, request) => {
    return createUsersWithListInputHandler({ data }, request)
  },
)

server.registerTool(
  'loginUser',
  {
    title: 'Logs user into the system',
    description: 'Make a GET request to /user/login',
    outputSchema: { data: loginUserStatus200Schema },
    inputSchema: { params: z.object({ username: loginUserQueryUsernameSchema, password: loginUserQueryPasswordSchema }) },
  },
  async ({ params }, request) => {
    return loginUserHandler({ params }, request)
  },
)

server.registerTool(
  'logoutUser',
  {
    title: 'Logs out current logged in user session',
    description: 'Make a GET request to /user/logout',
  },
  async (request) => {
    return logoutUserHandler(request)
  },
)

server.registerTool(
  'getUserByName',
  {
    title: 'Get user by user name',
    description: 'Make a GET request to /user/{username}',
    outputSchema: { data: getUserByNameStatus200Schema },
    inputSchema: { username: getUserByNamePathUsernameSchema },
  },
  async ({ username }, request) => {
    return getUserByNameHandler({ username }, request)
  },
)

server.registerTool(
  'updateUser',
  {
    title: 'Update user',
    description: 'This can only be done by the logged in user.',
    inputSchema: { username: updateUserPathUsernameSchema, data: updateUserDataSchema },
  },
  async ({ username, data }, request) => {
    return updateUserHandler({ username, data }, request)
  },
)

server.registerTool(
  'deleteUser',
  {
    title: 'Delete user',
    description: 'This can only be done by the logged in user.',
    inputSchema: { username: deleteUserPathUsernameSchema },
  },
  async ({ username }, request) => {
    return deleteUserHandler({ username }, request)
  },
)

export async function startServer() {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}
