import { addFilesHandler } from './pet/addFiles'
import { addPetHandler } from './pet/addPet'
import { deletePetHandler } from './pet/deletePet'
import { findPetsByStatusHandler } from './pet/findPetsByStatus'
import { findPetsByTagsHandler } from './pet/findPetsByTags'
import { getPetByIdHandler } from './pet/getPetById'
import { updatePetHandler } from './pet/updatePet'
import { updatePetWithFormHandler } from './pet/updatePetWithForm'
import { uploadFileHandler } from './pet/uploadFile'
import { createPetsHandler } from './pets/createPets'
import { addFilesBodySchema, addFilesStatus200Schema } from '../zod/pet/addFilesSchema'
import { addPetBodySchema } from '../zod/pet/addPetSchema'
import { deletePetHeaderApiKeySchema, deletePetPathPetIdSchema } from '../zod/pet/deletePetSchema'
import { findPetsByStatusPathStepIdSchema, findPetsByStatusStatus200Schema } from '../zod/pet/findPetsByStatusSchema'
import {
  findPetsByTagsHeaderXEXAMPLESchema,
  findPetsByTagsQueryPageSchema,
  findPetsByTagsQueryPageSizeSchema,
  findPetsByTagsQueryTagsSchema,
  findPetsByTagsStatus200Schema,
} from '../zod/pet/findPetsByTagsSchema'
import { getPetByIdPathPetIdSchema, getPetByIdStatus200Schema } from '../zod/pet/getPetByIdSchema'
import { updatePetBodySchema, updatePetStatus200Schema } from '../zod/pet/updatePetSchema'
import { updatePetWithFormPathPetIdSchema, updatePetWithFormQueryNameSchema, updatePetWithFormQueryStatusSchema } from '../zod/pet/updatePetWithFormSchema'
import {
  uploadFileBodySchema,
  uploadFilePathPetIdSchema,
  uploadFileQueryAdditionalMetadataSchema,
  uploadFileStatus200Schema,
} from '../zod/pet/uploadFileSchema'
import {
  createPetsBodySchema,
  createPetsHeaderXEXAMPLESchema,
  createPetsPathUuidSchema,
  createPetsQueryBoolParamSchema,
  createPetsQueryOffsetSchema,
  createPetsStatus201Schema,
} from '../zod/pets/createPetsSchema'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio'
import { z } from 'zod'

export function getServer() {
  const server = new McpServer({
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
        path: z.object({ uuid: createPetsPathUuidSchema }),
        query: z.object({ boolParam: createPetsQueryBoolParamSchema, offset: createPetsQueryOffsetSchema }),
        headers: z.object({ xEXAMPLE: createPetsHeaderXEXAMPLESchema }),
        body: createPetsBodySchema,
      },
    },
    async ({ path, query, headers, body }, request) => {
      return createPetsHandler({ path, query, headers, body }, request)
    },
  )

  server.registerTool(
    'updatePet',
    {
      title: 'Update an existing pet',
      description: 'Update an existing pet by Id',
      outputSchema: { data: updatePetStatus200Schema },
      inputSchema: { body: updatePetBodySchema },
    },
    async ({ body }, request) => {
      return updatePetHandler({ body }, request)
    },
  )

  server.registerTool(
    'addPet',
    {
      title: 'Add a new pet to the store',
      description: 'Add a new pet to the store',
      inputSchema: { body: addPetBodySchema },
    },
    async ({ body }, request) => {
      return addPetHandler({ body }, request)
    },
  )

  server.registerTool(
    'findPetsByStatus',
    {
      title: 'Finds Pets by status',
      description: 'Multiple status values can be provided with comma separated strings',
      outputSchema: { data: findPetsByStatusStatus200Schema },
      inputSchema: { path: z.object({ stepId: findPetsByStatusPathStepIdSchema }) },
    },
    async ({ path }, request) => {
      return findPetsByStatusHandler({ path }, request)
    },
  )

  server.registerTool(
    'findPetsByTags',
    {
      title: 'Finds Pets by tags',
      description: 'Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.',
      outputSchema: { data: findPetsByTagsStatus200Schema },
      inputSchema: {
        query: z.object({ tags: findPetsByTagsQueryTagsSchema, page: findPetsByTagsQueryPageSchema, pageSize: findPetsByTagsQueryPageSizeSchema }),
        headers: z.object({ xEXAMPLE: findPetsByTagsHeaderXEXAMPLESchema }),
      },
    },
    async ({ query, headers }, request) => {
      return findPetsByTagsHandler({ query, headers }, request)
    },
  )

  server.registerTool(
    'getPetById',
    {
      title: 'Find pet by ID',
      description: 'Returns a single pet',
      outputSchema: { data: getPetByIdStatus200Schema },
      inputSchema: { path: z.object({ petId: getPetByIdPathPetIdSchema }) },
    },
    async ({ path }, request) => {
      return getPetByIdHandler({ path }, request)
    },
  )

  server.registerTool(
    'updatePetWithForm',
    {
      title: 'Updates a pet in the store with form data',
      description: 'Make a POST request to /pet/{petId}:search',
      inputSchema: {
        path: z.object({ petId: updatePetWithFormPathPetIdSchema }),
        query: z.object({ name: updatePetWithFormQueryNameSchema, status: updatePetWithFormQueryStatusSchema }),
      },
    },
    async ({ path, query }, request) => {
      return updatePetWithFormHandler({ path, query }, request)
    },
  )

  server.registerTool(
    'deletePet',
    {
      title: 'Deletes a pet',
      description: 'delete a pet',
      inputSchema: { path: z.object({ petId: deletePetPathPetIdSchema }), headers: z.object({ apiKey: deletePetHeaderApiKeySchema }) },
    },
    async ({ path, headers }, request) => {
      return deletePetHandler({ path, headers }, request)
    },
  )

  server.registerTool(
    'addFiles',
    {
      title: 'Place an file for a pet',
      description: 'Place a new file in the store',
      outputSchema: { data: addFilesStatus200Schema },
      inputSchema: { body: addFilesBodySchema },
    },
    async ({ body }, request) => {
      return addFilesHandler({ body }, request)
    },
  )

  server.registerTool(
    'uploadFile',
    {
      title: 'uploads an image',
      description: 'Make a POST request to /pet/{petId}/uploadImage',
      outputSchema: { data: uploadFileStatus200Schema },
      inputSchema: {
        path: z.object({ petId: uploadFilePathPetIdSchema }),
        query: z.object({ additionalMetadata: uploadFileQueryAdditionalMetadataSchema }),
        body: uploadFileBodySchema,
      },
    },
    async ({ path, query, body }, request) => {
      return uploadFileHandler({ path, query, body }, request)
    },
  )

  return server
}

export const server = getServer()

export async function startServer() {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}
