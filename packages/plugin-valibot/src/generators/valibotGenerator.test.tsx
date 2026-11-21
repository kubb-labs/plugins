import { ast } from '@internals/ast'
import { Resolver } from '@kubb/kit'
import { describe, test } from 'vitest'
import {
  createMockedAdapter,
  createMockedPlugin,
  createMockedPluginDriver,
  matchFiles,
  renderGeneratorOperation,
  renderGeneratorSchema,
  testConfig,
} from '#mocks'
import { resolverValibot } from '../resolvers/resolverValibot.ts'
import type { PluginValibot } from '../types.ts'
import { createPrinterValibot, valibotGenerator } from './valibotGenerator.tsx'

const { createContent, createSchema, createProperty, createOperation, createParameter, createResponse } = ast.factory

const defaultOptions: PluginValibot['resolvedOptions'] = {
  inferred: false,
  importPath: 'valibot',
  regexType: 'literal',
  oneOfType: 'union',
  coercion: false,
  typeGuards: false,
  output: { path: '.', mode: 'directory' },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  printer: undefined,
}

const petRef = (schema?: ast.SchemaNode) => createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet', schema })

const petProperties = [
  createProperty({ name: 'id', required: true, schema: createSchema({ type: 'integer' }) }),
  createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string', min: 1 }) }),
  createProperty({ name: 'status', schema: createSchema({ type: 'enum', primitive: 'string', enumValues: ['available', 'sold'] }) }),
  createProperty({ name: 'friends', schema: createSchema({ type: 'array', items: [petRef()] }) }),
]

const petSchema = createSchema({ type: 'object', primitive: 'object', name: 'Pet', properties: petProperties })

const staySchema = createSchema({
  type: 'object',
  primitive: 'object',
  name: 'Stay',
  properties: [createProperty({ name: 'until', required: true, schema: createSchema({ type: 'date', representation: 'date', format: 'date' }) })],
})

function setup(name: string, optionOverrides: Partial<PluginValibot['resolvedOptions']> = {}) {
  const options = { ...defaultOptions, ...optionOverrides }
  const resolver = Resolver.merge(resolverValibot)

  return {
    driver: createMockedPluginDriver({ name }),
    context: {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      plugin: createMockedPlugin<PluginValibot>({ name: 'plugin-valibot', options, resolver }),
      options,
      resolver,
    },
  }
}

describe('valibotGenerator schema', () => {
  const schemas: Array<{ name: string; node: ast.SchemaNode; options?: Partial<PluginValibot['resolvedOptions']> }> = [
    { name: 'object', node: createSchema({ ...petSchema, properties: petProperties.slice(0, 3) }) },
    { name: 'inferred', node: createSchema({ type: 'array', name: 'PetNames', items: [createSchema({ type: 'string' })] }), options: { inferred: true } },
    { name: 'importPathCustom', node: createSchema({ type: 'string', name: 'PetName' }), options: { importPath: '../valibot.ts' } },
    {
      name: 'regexTypeConstructor',
      node: createSchema({ type: 'string', name: 'PetCode', pattern: '^[A-Z]{3}$' }),
      options: { regexType: 'constructor' },
    },
    {
      name: 'printerOverride',
      node: createSchema({ type: 'date', name: 'BirthDate', representation: 'string' }),
      options: { printer: { nodes: { date: () => 'v.pipe(v.string(), v.isoDate(), v.transform((value) => new Date(value)))' } } },
    },
  ]

  test.each(schemas)('$name', async ({ name, node, options }) => {
    const { driver, context } = setup(name, options)

    await renderGeneratorSchema(valibotGenerator, node, { ...context, driver, printer: createPrinterValibot })

    await matchFiles(driver.fileManager.files, name)
  })

  test('typeGuards adds an is* guard and an assert* function', async () => {
    const { driver, context } = setup('typeGuards', { typeGuards: true })

    await renderGeneratorSchema(valibotGenerator, createSchema({ type: 'integer', name: 'PetId' }), { ...context, driver, printer: createPrinterValibot })

    await matchFiles(driver.fileManager.files, 'typeGuards')
  })

  test('a schema with a Date field also gets an input variant that encodes', async () => {
    const { driver, context } = setup('inputVariant', { inferred: true })
    driver.inputNode = ast.factory.createInput({ schemas: [staySchema] })
    const node = createSchema({
      type: 'object',
      primitive: 'object',
      name: 'Visit',
      properties: [
        createProperty({ name: 'at', required: true, schema: createSchema({ type: 'date', representation: 'date' }) }),
        createProperty({ name: 'pet', schema: createSchema({ type: 'ref', name: 'Stay', ref: '#/components/schemas/Stay', schema: staySchema }) }),
      ],
    })

    await renderGeneratorSchema(valibotGenerator, node, { ...context, driver, printer: createPrinterValibot })

    await matchFiles(driver.fileManager.files, 'inputVariant')
  })

  test('a circular schema is annotated, so its v.lazy self-reference compiles', async () => {
    const { driver, context } = setup('circular', { inferred: true })
    driver.inputNode = ast.factory.createInput({ schemas: [petSchema] })

    await renderGeneratorSchema(valibotGenerator, petSchema, { ...context, driver, printer: createPrinterValibot })

    await matchFiles(driver.fileManager.files, 'circular')
  })
})

describe('valibotGenerator operation', () => {
  const operations: Array<{ name: string; node: ast.OperationNode; options?: Partial<PluginValibot['resolvedOptions']> }> = [
    {
      name: 'updatePet with params, request body, and several status codes',
      node: createOperation({
        operationId: 'updatePet',
        method: 'PUT',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [
          createParameter({ name: 'petId', in: 'path', required: true, schema: createSchema({ type: 'uuid' }) }),
          createParameter({ name: 'dryRun', in: 'query', schema: createSchema({ type: 'boolean', default: false }) }),
          createParameter({ name: 'X-Request-Id', in: 'header', schema: createSchema({ type: 'string' }) }),
        ],
        // The ref carries its target, which is what tells the printer the body is an object it can omit keys from.
        requestBody: {
          content: [
            createContent({
              contentType: 'application/json',
              schema: petRef(createSchema({ ...petSchema, properties: petProperties.slice(0, 3) })),
              keysToOmit: ['id'],
            }),
          ],
        },
        responses: [
          createResponse({ statusCode: '200', schema: petRef(), description: 'Updated' }),
          createResponse({ statusCode: '204', description: 'No content' }),
          createResponse({
            statusCode: '404',
            description: 'Not found',
            schema: createSchema({
              type: 'object',
              primitive: 'object',
              properties: [createProperty({ name: 'message', required: true, schema: createSchema({ type: 'string' }) })],
            }),
          }),
        ],
      }),
      options: { inferred: true },
    },
    {
      name: 'uploadFile with several request content types',
      node: createOperation({
        operationId: 'uploadFile',
        method: 'POST',
        path: '/files',
        tags: ['files'],
        requestBody: {
          content: [
            createContent({ contentType: 'application/octet-stream', schema: createSchema({ type: 'blob' }) }),
            createContent({ contentType: 'application/json', schema: createSchema({ type: 'string', format: 'byte' }) }),
          ],
        },
        responses: [createResponse({ statusCode: '201', description: 'Created' })],
      }),
    },
  ]

  test('a request body that is a circular schema prints inline without its readOnly keys', async () => {
    const { driver, context } = setup('circularBody')
    driver.inputNode = ast.factory.createInput({ schemas: [petSchema] })
    const node = createOperation({
      operationId: 'addPet',
      method: 'POST',
      path: '/pets',
      tags: ['pets'],
      requestBody: { content: [createContent({ contentType: 'application/json', schema: petRef(petSchema), keysToOmit: ['id'] })] },
      responses: [createResponse({ statusCode: '204', description: 'Created' })],
    })

    await renderGeneratorOperation(valibotGenerator, node, { ...context, driver, printer: createPrinterValibot })

    await matchFiles(driver.fileManager.files, 'circularBody')
  })

  test('a request body that is a circular allOf drops the readOnly keys of every member', async () => {
    const { driver, context } = setup('circularAllOfBody')
    // This schema declares `id`, so a member that references it prints inline without it.
    const entityRef = createSchema({
      type: 'ref',
      name: 'Entity',
      ref: '#/components/schemas/Entity',
      schema: createSchema({
        type: 'object',
        primitive: 'object',
        name: 'Entity',
        properties: [
          createProperty({ name: 'id', required: true, schema: createSchema({ type: 'integer' }) }),
          createProperty({ name: 'createdBy', required: true, schema: createSchema({ type: 'string' }) }),
        ],
      }),
    })
    const target = createSchema({
      type: 'intersection',
      name: 'Pet',
      members: [
        createSchema({ type: 'ref', name: 'Animal', ref: '#/components/schemas/Animal' }),
        entityRef,
        // The same schema a second time, nested: it must lose `id` here too.
        createSchema({ type: 'intersection', members: [entityRef, createSchema({ type: 'string' })] }),
        createSchema({ ...petSchema, name: undefined }),
      ],
    })
    driver.inputNode = ast.factory.createInput({ schemas: [target] })
    const node = createOperation({
      operationId: 'addPet',
      method: 'POST',
      path: '/pets',
      tags: ['pets'],
      requestBody: { content: [createContent({ contentType: 'application/json', schema: petRef(target), keysToOmit: ['id'] })] },
      responses: [createResponse({ statusCode: '204', description: 'Created' })],
    })

    await renderGeneratorOperation(valibotGenerator, node, { ...context, driver, printer: createPrinterValibot })

    await matchFiles(driver.fileManager.files, 'circularAllOfBody')
  })

  test('a request encodes a Date and a response decodes it', async () => {
    const { driver, context } = setup('codec', { inferred: true })
    const stayRef = () => createSchema({ type: 'ref', name: 'Stay', ref: '#/components/schemas/Stay', schema: staySchema })
    const node = createOperation({
      operationId: 'bookStay',
      method: 'POST',
      path: '/stays',
      tags: ['stays'],
      parameters: [createParameter({ name: 'from', in: 'query', schema: createSchema({ type: 'date', representation: 'date', format: 'date' }) })],
      requestBody: { content: [createContent({ contentType: 'application/json', schema: stayRef() })] },
      responses: [createResponse({ statusCode: '200', schema: stayRef(), description: 'Booked' })],
    })

    await renderGeneratorOperation(valibotGenerator, node, { ...context, driver, printer: createPrinterValibot })

    await matchFiles(driver.fileManager.files, 'codec')
  })

  test.each(operations)('$name', async ({ name, node, options }) => {
    const { driver, context } = setup(name, options)

    await renderGeneratorOperation(valibotGenerator, node, { ...context, driver, printer: createPrinterValibot })

    await matchFiles(driver.fileManager.files, name)
  })
})
