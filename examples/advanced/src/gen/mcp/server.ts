import { addFilesHandler } from './pet/addFiles.ts'
import { addPetHandler } from './pet/addPet.ts'
import { deletePetHandler } from './pet/deletePet.ts'
import { findPetsByStatusHandler } from './pet/findPetsByStatus.ts'
import { findPetsByTagsHandler } from './pet/findPetsByTags.ts'
import { getPetByIdHandler } from './pet/getPetById.ts'
import { updatePetHandler } from './pet/updatePet.ts'
import { updatePetWithFormHandler } from './pet/updatePetWithForm.ts'
import { uploadFileHandler } from './pet/uploadFile.ts'
import { createPetsHandler } from './pets/createPets.ts'
import { addFilesDataSchema, addFilesStatus200Schema } from '../zod/pet/addFilesSchema.ts'
import { addPetDataSchema } from '../zod/pet/addPetSchema.ts'
import { deletePetHeaderApiKeySchema, deletePetPathPetIdSchema } from '../zod/pet/deletePetSchema.ts'
import { findPetsByStatusPathStepIdSchema, findPetsByStatusStatus200Schema } from '../zod/pet/findPetsByStatusSchema.ts'
import {
  findPetsByTagsHeaderXEXAMPLESchema,
  findPetsByTagsQueryPageSchema,
  findPetsByTagsQueryPageSizeSchema,
  findPetsByTagsQueryTagsSchema,
  findPetsByTagsStatus200Schema,
} from '../zod/pet/findPetsByTagsSchema.ts'
import { getPetByIdPathPetIdSchema, getPetByIdStatus200Schema } from '../zod/pet/getPetByIdSchema.ts'
import { updatePetDataSchema, updatePetStatus200Schema } from '../zod/pet/updatePetSchema.ts'
import { updatePetWithFormPathPetIdSchema, updatePetWithFormQueryNameSchema, updatePetWithFormQueryStatusSchema } from '../zod/pet/updatePetWithFormSchema.ts'
import {
  uploadFileDataSchema,
  uploadFilePathPetIdSchema,
  uploadFileQueryAdditionalMetadataSchema,
  uploadFileStatus200Schema,
} from '../zod/pet/uploadFileSchema.ts'
import {
  createPetsDataSchema,
  createPetsHeaderXEXAMPLESchema,
  createPetsPathUuidSchema,
  createPetsQueryBoolParamSchema,
  createPetsQueryOffsetSchema,
  createPetsStatus201Schema,
} from '../zod/pets/createPetsSchema.ts'
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
        body: createPetsDataSchema,
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
      inputSchema: { body: updatePetDataSchema },
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
      inputSchema: { body: addPetDataSchema },
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
      inputSchema: { body: addFilesDataSchema },
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
        body: uploadFileDataSchema,
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
