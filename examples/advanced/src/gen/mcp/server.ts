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
import { createPaymentBatchBodySchema, createPaymentBatchStatus204Schema } from '../zod/store/payment/createPaymentBatchSchema'
import { createPaymentBodySchema, createPaymentStatus201Schema } from '../zod/store/payment/createPaymentSchema'
import { getPaymentByIdPathPaymentIdSchema, getPaymentByIdStatus200Schema } from '../zod/store/payment/getPaymentByIdSchema'
import {
  listPaymentsCookieSessionSchema,
  listPaymentsQueryFilterSchema,
  listPaymentsQueryStatusSchema,
  listPaymentsStatus2xxSchema,
} from '../zod/store/payment/listPaymentsSchema'
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
import { createPaymentHandler } from './store/payment/createPayment'
import { createPaymentBatchHandler } from './store/payment/createPaymentBatch'
import { getPaymentByIdHandler } from './store/payment/getPaymentById'
import { listPaymentsHandler } from './store/payment/listPayments'
import { serveStdio } from '@modelcontextprotocol/server/stdio'
import { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

/**
 * Converts with `unrepresentable: "any"`, because a `bigint` or `Blob` in one tool schema fails every `tools/list` request.
 * A `bigint` is listed as an `int64` integer and a `Blob` as an unconstrained value.
 */
function toolSchema<T extends z.ZodType>(schema: T) {
  const standard = schema['~standard']
  const convert = (io: 'input' | 'output') => (options: Parameters<typeof standard.jsonSchema.input>[0]) =>
    standard.jsonSchema[io]({
      ...options,
      libraryOptions: {
        unrepresentable: 'any',
        override: ({ zodSchema, jsonSchema }: { zodSchema: z.core.$ZodType; jsonSchema: Record<string, unknown> }) => {
          if (zodSchema._zod.def.type === 'bigint') {
            jsonSchema.type = 'integer'
            jsonSchema.format = 'int64'
          }
        },
      },
    })

  return { '~standard': { ...standard, jsonSchema: { input: convert('input'), output: convert('output') } } }
}

export function getServer() {
  const server = new McpServer({
    name: 'Swagger PetStore - OpenAPI 3.2',
    version: '1.0.11',
  })

  server.registerTool(
    'createPets',
    {
      title: 'Create a pet',
      description: 'Make a POST request to /pets/{uuid}',
      outputSchema: toolSchema(z.object({ data: createPetsStatus201Schema })),
      inputSchema: toolSchema(
        z.object({
          path: z.object({ uuid: createPetsPathUuidSchema }),
          query: z.object({ bool_param: createPetsQueryBoolParamSchema, offset: createPetsQueryOffsetSchema }),
          headers: z.object({ 'X-EXAMPLE': createPetsHeaderXEXAMPLESchema }),
          body: createPetsBodySchema,
        }),
      ),
    },
    async ({ path, query, headers, body }, ctx) => {
      return createPetsHandler({ path, query, headers, body }, ctx)
    },
  )

  server.registerTool(
    'updatePet',
    {
      title: 'Update an existing pet',
      description: 'Update an existing pet by Id',
      outputSchema: toolSchema(z.object({ data: updatePetStatus200Schema })),
      inputSchema: toolSchema(z.object({ body: updatePetBodySchema })),
    },
    async ({ body }, ctx) => {
      return updatePetHandler({ body }, ctx)
    },
  )

  server.registerTool(
    'addPet',
    {
      title: 'Add a new pet to the store',
      description: 'Add a new pet to the store',
      inputSchema: toolSchema(z.object({ body: addPetBodySchema })),
    },
    async ({ body }, ctx) => {
      return addPetHandler({ body }, ctx)
    },
  )

  server.registerTool(
    'findPetsByStatus',
    {
      title: 'Finds Pets by status',
      description: 'Multiple status values can be provided with comma separated strings',
      outputSchema: toolSchema(z.object({ data: findPetsByStatusStatus200Schema })),
      inputSchema: toolSchema(z.object({ path: z.object({ step_id: findPetsByStatusPathStepIdSchema }) })),
    },
    async ({ path }, ctx) => {
      return findPetsByStatusHandler({ path }, ctx)
    },
  )

  server.registerTool(
    'findPetsByTags',
    {
      title: 'Finds Pets by tags',
      description: 'Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.',
      outputSchema: toolSchema(z.object({ data: findPetsByTagsStatus200Schema })),
      inputSchema: toolSchema(
        z.object({
          query: z.object({ tags: findPetsByTagsQueryTagsSchema, page: findPetsByTagsQueryPageSchema, pageSize: findPetsByTagsQueryPageSizeSchema }),
          headers: z.object({ 'X-EXAMPLE': findPetsByTagsHeaderXEXAMPLESchema }),
        }),
      ),
    },
    async ({ query, headers }, ctx) => {
      return findPetsByTagsHandler({ query, headers }, ctx)
    },
  )

  server.registerTool(
    'getPetById',
    {
      title: 'Find pet by ID',
      description: 'Returns a single pet',
      outputSchema: toolSchema(z.object({ data: getPetByIdStatus200Schema })),
      inputSchema: toolSchema(z.object({ path: z.object({ petId: getPetByIdPathPetIdSchema }) })),
    },
    async ({ path }, ctx) => {
      return getPetByIdHandler({ path }, ctx)
    },
  )

  server.registerTool(
    'updatePetWithForm',
    {
      title: 'Updates a pet in the store with form data',
      description: 'Make a POST request to /pet/{petId}:search',
      inputSchema: toolSchema(
        z.object({
          path: z.object({ petId: updatePetWithFormPathPetIdSchema }),
          query: z.object({ name: updatePetWithFormQueryNameSchema, status: updatePetWithFormQueryStatusSchema }),
        }),
      ),
    },
    async ({ path, query }, ctx) => {
      return updatePetWithFormHandler({ path, query }, ctx)
    },
  )

  server.registerTool(
    'deletePet',
    {
      title: 'Deletes a pet',
      description: 'delete a pet',
      inputSchema: toolSchema(z.object({ path: z.object({ petId: deletePetPathPetIdSchema }), headers: z.object({ api_key: deletePetHeaderApiKeySchema }) })),
    },
    async ({ path, headers }, ctx) => {
      return deletePetHandler({ path, headers }, ctx)
    },
  )

  server.registerTool(
    'addFiles',
    {
      title: 'Place an file for a pet',
      description: 'Place a new file in the store',
      outputSchema: toolSchema(z.object({ data: addFilesStatus200Schema })),
      inputSchema: toolSchema(z.object({ body: addFilesBodySchema })),
    },
    async ({ body }, ctx) => {
      return addFilesHandler({ body }, ctx)
    },
  )

  server.registerTool(
    'uploadFile',
    {
      title: 'uploads an image',
      description: 'Make a POST request to /pet/{petId}/uploadImage',
      outputSchema: toolSchema(z.object({ data: uploadFileStatus200Schema })),
      inputSchema: toolSchema(
        z.object({
          path: z.object({ petId: uploadFilePathPetIdSchema }),
          query: z.object({ additionalMetadata: uploadFileQueryAdditionalMetadataSchema }),
          body: uploadFileBodySchema,
        }),
      ),
    },
    async ({ path, query, body }, ctx) => {
      return uploadFileHandler({ path, query, body }, ctx)
    },
  )

  server.registerTool(
    'listPayments',
    {
      title: 'List payments',
      description: 'Make a GET request to /store/payments',
      outputSchema: toolSchema(z.object({ data: listPaymentsStatus2xxSchema })),
      inputSchema: toolSchema(
        z.object({
          query: z.object({ status: listPaymentsQueryStatusSchema, filter: listPaymentsQueryFilterSchema }),
          cookies: z.object({ session: listPaymentsCookieSessionSchema }),
        }),
      ),
    },
    async ({ query, cookies }, ctx) => {
      return listPaymentsHandler({ query, cookies }, ctx)
    },
  )

  server.registerTool(
    'createPayment',
    {
      title: 'Pay for an order',
      description: 'Make a POST request to /store/payments',
      outputSchema: toolSchema(z.object({ data: createPaymentStatus201Schema })),
      inputSchema: toolSchema(z.object({ body: createPaymentBodySchema })),
    },
    async ({ body }, ctx) => {
      return createPaymentHandler({ body }, ctx)
    },
  )

  server.registerTool(
    'createPaymentBatch',
    {
      title: 'Pay for several orders at once',
      description: 'Make a POST request to /store/payments/batch',
      outputSchema: toolSchema(z.object({ data: createPaymentBatchStatus204Schema })),
      inputSchema: toolSchema(z.object({ body: createPaymentBatchBodySchema })),
    },
    async ({ body }, ctx) => {
      return createPaymentBatchHandler({ body }, ctx)
    },
  )

  server.registerTool(
    'getPaymentById',
    {
      title: 'Find a payment by ID',
      description: 'Make a GET request to /store/payments/{paymentId}',
      outputSchema: toolSchema(z.object({ data: getPaymentByIdStatus200Schema })),
      inputSchema: toolSchema(z.object({ path: z.object({ paymentId: getPaymentByIdPathPaymentIdSchema }) })),
    },
    async ({ path }, ctx) => {
      return getPaymentByIdHandler({ path }, ctx)
    },
  )

  return server
}

export const server = getServer()

export async function startServer() {
  return serveStdio(getServer, {
    onerror: (error) => console.error('MCP server error:', error),
  })
}
