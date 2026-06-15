import path from 'node:path'
import { camelCase } from '@internals/utils'

import type { Config, Group } from '@kubb/core'
import { ast, memoryStorage } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation, renderGeneratorSchema } from '@kubb/core/mocks'
import { describe, expect, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverTs } from '../resolvers/resolverTs.ts'
import type { PluginTs } from '../types.ts'
import { typeGenerator } from './typeGenerator.tsx'

const testConfig: Config = {
  root: '.',
  input: { path: '' },
  output: { path: 'test' },
  plugins: [],
  parsers: [],
  reporters: [],
  adapter: createMockedAdapter(),
  storage: memoryStorage(),
}

const defaultOptions: PluginTs['resolvedOptions'] = {
  enum: { type: 'asConst', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' },
  optionalType: 'questionToken',
  arrayType: 'array',
  syntaxType: 'type',
  paramsCasing: undefined,
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  printer: undefined,
}

const enumSchema = ast.factory.createSchema({
  type: 'enum',
  name: 'petStatus',
  primitive: 'string',
  enumValues: ['available', 'pending', 'sold'],
})

const multiWordEnumSchema = ast.factory.createSchema({
  type: 'enum',
  name: 'orderStatus',
  primitive: 'string',
  enumValues: ['in_progress', 'awaiting_payment', 'fully_shipped'],
})

const objectSchema = ast.factory.createSchema({
  type: 'object',
  name: 'Pet',
  properties: [
    ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
    ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
    ast.factory.createProperty({ name: 'description', schema: ast.factory.createSchema({ type: 'string', optional: true }) }),
    ast.factory.createProperty({ name: 'tags', schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] }) }),
  ],
})

const operationWithSnakeCaseParams: ast.OperationNode = ast.factory.createOperation({
  operationId: 'updatePet',
  method: 'POST',
  path: '/pets/{pet_id}',
  tags: ['pets'],
  parameters: [
    ast.factory.createParameter({ name: 'pet_id', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
    ast.factory.createParameter({ name: 'include_deleted', in: 'query', schema: ast.factory.createSchema({ type: 'boolean' }) }),
    ast.factory.createParameter({ name: 'request_source', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) }),
  ],
  requestBody: {
    content: [
      {
        contentType: 'application/json',
        schema: ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
        }),
      },
    ],
  },
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Success' })],
})

describe('typeGenerator — Operation', () => {
  const operations = [
    {
      name: 'listPets — GET with query params',
      node: ast.factory.createOperation({
        operationId: 'listPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) })],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', properties: [] }),
            description: 'A paged array of pets',
          }),
          ast.factory.createResponse({
            statusCode: 'default',
            schema: ast.factory.createSchema({ type: 'object', properties: [] }),
            description: 'Unexpected error',
          }),
        ],
      }),
    },
    {
      name: 'showPetById — GET with path param',
      node: ast.factory.createOperation({
        operationId: 'showPetById',
        method: 'GET',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', properties: [] }),
            description: 'Expected response',
          }),
          ast.factory.createResponse({
            statusCode: 'default',
            schema: ast.factory.createSchema({ type: 'object', properties: [] }),
            description: 'Unexpected error',
          }),
        ],
      }),
    },
    {
      name: 'findPetsByStatus — GET with query param enum',
      node: ast.factory.createOperation({
        operationId: 'findPetsByStatus',
        method: 'GET',
        path: '/pet/findByStatus',
        tags: ['pet'],
        parameters: [
          ast.factory.createParameter({
            name: 'status',
            in: 'query',
            schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['available', 'pending', 'sold'] }),
          }),
        ],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', properties: [] }),
            description: 'Successful operation',
          }),
        ],
      }),
    },
    {
      name: 'addPet — POST with request body',
      node: ast.factory.createOperation({
        operationId: 'addPet',
        method: 'POST',
        path: '/pet',
        tags: ['pet'],
        requestBody: { content: [{ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) }] },
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', properties: [] }),
            description: 'Successful operation',
          }),
          ast.factory.createResponse({ statusCode: '405', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
        ],
      }),
    },
    {
      name: 'updatePetWithForm — POST with path and query params',
      node: ast.factory.createOperation({
        operationId: 'updatePetWithForm',
        method: 'POST',
        path: '/pet/{petId}',
        tags: ['pet'],
        parameters: [
          ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'integer' }), required: true }),
          ast.factory.createParameter({ name: 'name', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) }),
          ast.factory.createParameter({ name: 'status', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) }),
        ],
        responses: [
          ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'void' }), description: 'Success' }),
          ast.factory.createResponse({ statusCode: '405', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
        ],
      }),
    },
    {
      name: 'placeOrderPatch — PATCH with path params + request body + multiple status codes',
      node: ast.factory.createOperation({
        operationId: 'placeOrderPatch',
        method: 'PATCH',
        path: '/store/order/:orderId',
        tags: ['store'],
        parameters: [ast.factory.createParameter({ name: 'orderId', in: 'path', schema: ast.factory.createSchema({ type: 'integer' }), required: true })],
        requestBody: {
          content: [{ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [], description: 'Order payload' }) }],
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', properties: [] }),
            description: 'Successful operation',
          }),
          ast.factory.createResponse({ statusCode: '405', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
        ],
      }),
    },
    {
      name: 'deletePet — DELETE with no response body',
      node: ast.factory.createOperation({
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
        responses: [ast.factory.createResponse({ statusCode: '204', description: 'No content', schema: ast.factory.createSchema({ type: 'void' }) })],
      }),
    },
    {
      name: 'findArtifacts — GET with multiple query params',
      node: ast.factory.createOperation({
        operationId: 'findArtifacts',
        method: 'GET',
        path: '/artifacts',
        tags: ['artifacts'],
        parameters: [
          ast.factory.createParameter({ name: 'page', in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) }),
          ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) }),
          ast.factory.createParameter({ name: 'sort', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) }),
        ],
        responses: [
          ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Results' }),
        ],
      }),
    },
    {
      name: 'noTagsOperation — GET with no tags',
      node: ast.factory.createOperation({
        operationId: 'get_enterprise_configurations_id_v2025.0',
        method: 'GET',
        path: '/enterprise_configurations/:enterprise_id',
        tags: [],
        parameters: [ast.factory.createParameter({ name: 'enterprise_id', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', properties: [] }),
            description: 'Enterprise config',
          }),
        ],
      }),
    },
    {
      // Regression for kubb-labs/plugins#132: an inline response that is an array of objects with a
      // nested enum property must stay an array of objects, not collapse into an array of the enum.
      name: 'getPreferencesUnits — GET with inline array-of-object response containing a nested enum',
      node: ast.factory.createOperation({
        operationId: 'getPreferencesUnits',
        method: 'GET',
        path: '/preferences/units/',
        tags: ['Preferences'],
        parameters: [],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            description: 'OK',
            schema: ast.factory.createSchema({
              type: 'array',
              name: 'GetPreferencesUnitsStatus200',
              items: [
                ast.factory.createSchema({
                  type: 'object',
                  name: 'GetPreferencesUnitsStatus200',
                  primitive: 'object',
                  properties: [
                    ast.factory.createProperty({
                      name: 'id',
                      required: true,
                      schema: ast.factory.createSchema({ type: 'number', primitive: 'number', name: 'GetPreferencesUnitsStatus200Id' }),
                    }),
                    ast.factory.createProperty({
                      name: 'type',
                      required: true,
                      schema: ast.factory.createSchema({
                        type: 'enum',
                        primitive: 'string',
                        name: 'GetPreferencesUnitsStatus200TypeEnum',
                        enumValues: ['area', 'density', 'length'],
                      }),
                    }),
                    ast.factory.createProperty({
                      name: 'value',
                      required: true,
                      schema: ast.factory.createSchema({ type: 'string', primitive: 'string', name: 'GetPreferencesUnitsStatus200Value' }),
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
    },
    {
      // Regression for kubb-labs/kubb#3475: with `enumType: 'asConst'`, an array whose items
      // are an object containing a nested enum property must keep its object shape, not
      // collapse into an array of the (first) nested enum.
      name: 'arrayOfObjectWithNestedEnum — regression for kubb-labs/kubb#3475',
      node: ast.factory.createOperation({
        operationId: 'getArrayOfObject',
        method: 'GET',
        path: '/array-of-object',
        tags: ['regression'],
        parameters: [],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            description: 'OK',
            schema: ast.factory.createSchema({
              type: 'array',
              name: 'ArrayOfObject',
              items: [
                ast.factory.createSchema({
                  type: 'object',
                  name: 'ArrayOfObject',
                  primitive: 'object',
                  properties: [
                    ast.factory.createProperty({
                      name: 'id',
                      required: true,
                      schema: ast.factory.createSchema({ type: 'integer', primitive: 'number', name: 'ArrayOfObjectId' }),
                    }),
                    ast.factory.createProperty({
                      name: 'status',
                      required: true,
                      schema: ast.factory.createSchema({
                        type: 'enum',
                        primitive: 'string',
                        name: 'ArrayOfObjectStatusEnum',
                        enumValues: ['active', 'inactive'],
                      }),
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
    },
    {
      name: 'multiContentType — POST with json and form-data request body',
      node: ast.factory.createOperation({
        operationId: 'uploadFile',
        method: 'POST',
        path: '/pet/{petId}/uploadImage',
        tags: ['pet'],
        parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
        requestBody: {
          content: [
            {
              contentType: 'application/json',
              schema: ast.factory.createSchema({
                type: 'object',
                properties: [ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
              }),
            },
            {
              contentType: 'multipart/form-data',
              schema: ast.factory.createSchema({
                type: 'object',
                properties: [ast.factory.createProperty({ name: 'file', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
              }),
            },
          ],
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', properties: [] }),
            description: 'Successful operation',
          }),
        ],
      }),
    },
    {
      name: 'multiContentType — GET with json and xml response body',
      node: ast.factory.createOperation({
        operationId: 'getPetById',
        method: 'GET',
        path: '/pet/{petId}',
        tags: ['pet'],
        parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            description: 'Successful operation',
            schema: ast.factory.createSchema({
              type: 'object',
              properties: [ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
            }),
            content: [
              {
                contentType: 'application/json',
                schema: ast.factory.createSchema({
                  type: 'object',
                  properties: [ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
                }),
              },
              {
                contentType: 'application/xml',
                schema: ast.factory.createSchema({
                  type: 'object',
                  properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) })],
                }),
              },
            ],
          }),
        ],
      }),
    },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode }>

  test.each(operations)('$name', async (props) => {
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: defaultOptions, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderGeneratorOperation(typeGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})

describe('typeGenerator — Operation — group', () => {
  const node = ast.factory.createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    parameters: [ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) })],
    responses: [
      ast.factory.createResponse({
        statusCode: '200',
        schema: ast.factory.createSchema({ type: 'object', properties: [] }),
        description: 'A paged array of pets',
      }),
      ast.factory.createResponse({
        statusCode: 'default',
        schema: ast.factory.createSchema({ type: 'object', properties: [] }),
        description: 'Unexpected error',
      }),
    ],
  })

  test.each([
    {
      group: {
        type: 'tag',
        name: (ctx: { group: string }) => `${camelCase(ctx.group)}Controller`,
      } satisfies Group,
      expectedBaseName: 'ListPets.ts',
      expectedDir: 'petsController',
    },
    { group: null, expectedBaseName: 'ListPets.ts', expectedDir: undefined },
  ] satisfies Array<{
    group: Group | null
    expectedBaseName: string
    expectedDir: string | undefined
  }>)('group=$group.type — file path is computed correctly', async ({ group, expectedBaseName, expectedDir }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, group }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'listPets', config: testConfig })

    await renderGeneratorOperation(typeGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    const file = driver.fileManager.files.find((f: ast.FileNode) => f.baseName === expectedBaseName)
    expect(file).toBeDefined()
    const root = path.resolve(testConfig.root, testConfig.output.path, options.output.path)
    const expectedPath = expectedDir ? path.resolve(root, expectedDir, expectedBaseName) : path.resolve(root, expectedBaseName)
    expect(file!.path).toBe(expectedPath)
  })

  test('group=tag with empty tags falls back to default', async () => {
    const noTagNode = ast.factory.createOperation({
      operationId: 'getConfig',
      method: 'GET',
      path: '/config',
      tags: [],
      responses: [
        ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Config' }),
      ],
    })
    const options: PluginTs['resolvedOptions'] = {
      ...defaultOptions,
      group: {
        type: 'tag',
        name: (ctx: { group: string }) => `${camelCase(ctx.group)}Controller`,
      },
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'getConfig', config: testConfig })

    await renderGeneratorOperation(typeGenerator, noTagNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    const file = driver.fileManager.files.find((f: ast.FileNode) => f.baseName === 'GetConfig.ts')
    expect(file).toBeDefined()
    const root = path.resolve(testConfig.root, testConfig.output.path, options.output.path)
    expect(file!.path).toBe(path.resolve(root, 'defaultController', 'GetConfig.ts'))
  })
})

describe('typeGenerator — Operation — output.mode', () => {
  const node = ast.factory.createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    responses: [
      ast.factory.createResponse({
        statusCode: '200',
        schema: ast.factory.createSchema({ type: 'object', properties: [] }),
        description: 'A paged array of pets',
      }),
    ],
  })

  test("mode 'file' writes the operation into the single output file", async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, output: { path: 'types.ts', mode: 'file' } }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'listPets', config: testConfig })

    await renderGeneratorOperation(typeGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    const file = driver.fileManager.files.at(0)
    expect(file).toBeDefined()
    expect(file!.path).toBe(path.resolve(testConfig.root, testConfig.output.path, 'types.ts'))
    expect(file!.baseName).toBe('types.ts')
  })

  test("mode 'directory' with group places a tagged operation in a per-tag subdirectory", async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, output: { path: 'types', mode: 'directory' }, group: { type: 'tag' } }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'listPets', config: testConfig })

    await renderGeneratorOperation(typeGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    const root = path.resolve(testConfig.root, testConfig.output.path, options.output.path)
    const file = driver.fileManager.files.find((f: ast.FileNode) => path.dirname(f.path) === path.resolve(root, 'pets'))
    expect(file).toBeDefined()
  })
})

describe('typeGenerator — paramsCasing', () => {
  test('paramsCasing undefined — snake_case params kept as-is', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, paramsCasing: undefined }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'paramsCasing undefined' })

    await renderGeneratorOperation(typeGenerator, operationWithSnakeCaseParams, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'paramsCasing undefined')
  })

  test('paramsCasing camelcase — snake_case params converted to camelCase', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, paramsCasing: 'camelcase' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'paramsCasing camelcase' })

    await renderGeneratorOperation(typeGenerator, operationWithSnakeCaseParams, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'paramsCasing camelcase')
  })
})

describe('typeGenerator — enumType', () => {
  const enumTypes = ['asConst', 'enum', 'constEnum', 'literal', 'inlineLiteral'] as const satisfies Array<
    NonNullable<PluginTs['resolvedOptions']['enum']['type']>
  >

  test.each(enumTypes.map((t) => ({ enumType: t })))('enumType $enumType', async ({ enumType }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enum: { ...defaultOptions.enum, type: enumType } }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `enumType ${enumType}` })

    await renderGeneratorSchema(typeGenerator, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, `enumType ${enumType}`)
  })
})

describe('typeGenerator — enumType — dotted name', () => {
  const dottedEnumSchema = ast.factory.createSchema({
    type: 'enum',
    name: 'enumNames.Type',
    primitive: 'string',
    enumValues: ['available', 'pending', 'sold'],
  })

  const dottedDefaultOptions: PluginTs['resolvedOptions'] = { ...defaultOptions, enum: { ...defaultOptions.enum, typeSuffix: 'EnumKey' } }

  const enumTypes = ['asConst', 'constEnum', 'enum', 'literal', 'inlineLiteral'] as const

  test.each(enumTypes.map((et) => ({ enumType: et })))('enumType=$enumType — top-level enum with dotted name', async ({ enumType }) => {
    const options: PluginTs['resolvedOptions'] = { ...dottedDefaultOptions, enum: { ...dottedDefaultOptions.enum, type: enumType } }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `enumNames.Type — ${enumType}` })

    await renderGeneratorSchema(typeGenerator, dottedEnumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, `enumNames.Type — ${enumType}`)
  })
})

describe('typeGenerator — enumKeyCasing', () => {
  const casingVariants = ['screamingSnakeCase', 'snakeCase', 'pascalCase', 'camelCase', 'none'] as const satisfies Array<
    NonNullable<PluginTs['resolvedOptions']['enum']['keyCasing']>
  >

  test.each(casingVariants.map((c) => ({ enumKeyCasing: c })))('enumKeyCasing $enumKeyCasing', async ({ enumKeyCasing }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enum: { ...defaultOptions.enum, type: 'asConst', keyCasing: enumKeyCasing } }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `enumKeyCasing ${enumKeyCasing}` })

    await renderGeneratorSchema(typeGenerator, multiWordEnumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, `enumKeyCasing ${enumKeyCasing}`)
  })
})

describe('typeGenerator — enumTypeSuffix', () => {
  test('enumTypeSuffix Key (default)', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enum: { ...defaultOptions.enum, type: 'asConst', typeSuffix: 'Key' } }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'enumTypeSuffix Key' })

    await renderGeneratorSchema(typeGenerator, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'enumTypeSuffix Key')
  })

  test('enumTypeSuffix Value', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enum: { ...defaultOptions.enum, type: 'asConst', typeSuffix: 'Value' } }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'enumTypeSuffix Value' })

    await renderGeneratorSchema(typeGenerator, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'enumTypeSuffix Value')
  })

  test('enumTypeSuffix empty string', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enum: { ...defaultOptions.enum, type: 'asConst', typeSuffix: '' } }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'enumTypeSuffix empty' })

    await renderGeneratorSchema(typeGenerator, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'enumTypeSuffix empty')
  })
})

describe('typeGenerator — enumConstCasing', () => {
  test('constCasing pascalCase keeps the Key-suffixed type', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enum: { ...defaultOptions.enum, type: 'asConst', constCasing: 'pascalCase' } }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'enumConstCasing pascalCase' })

    await renderGeneratorSchema(typeGenerator, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'enumConstCasing pascalCase')
  })

  test('constCasing pascalCase with empty typeSuffix merges the const and type under one name', async () => {
    const options: PluginTs['resolvedOptions'] = {
      ...defaultOptions,
      enum: { ...defaultOptions.enum, type: 'asConst', constCasing: 'pascalCase', typeSuffix: '' },
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'enumConstCasing merged name' })

    await renderGeneratorSchema(typeGenerator, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'enumConstCasing merged name')
  })
})

describe('typeGenerator — syntaxType', () => {
  test('syntaxType type (default)', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, syntaxType: 'type' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'syntaxType type' })

    await renderGeneratorSchema(typeGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'syntaxType type')
  })

  test('syntaxType interface', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, syntaxType: 'interface' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'syntaxType interface' })

    await renderGeneratorSchema(typeGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'syntaxType interface')
  })
})

describe('typeGenerator — optionalType', () => {
  const optionalTypes = ['questionToken', 'undefined', 'questionTokenAndUndefined'] as const satisfies Array<
    NonNullable<PluginTs['resolvedOptions']['optionalType']>
  >

  test.each(optionalTypes.map((t) => ({ optionalType: t })))('optionalType $optionalType', async ({ optionalType }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, optionalType }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `optionalType ${optionalType}` })

    await renderGeneratorSchema(typeGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, `optionalType ${optionalType}`)
  })
})

describe('typeGenerator — arrayType', () => {
  const arrayTypes = ['array', 'generic'] as const satisfies Array<NonNullable<PluginTs['resolvedOptions']['arrayType']>>

  test.each(arrayTypes.map((t) => ({ arrayType: t })))('arrayType $arrayType', async ({ arrayType }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, arrayType }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `arrayType ${arrayType}` })

    await renderGeneratorSchema(typeGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, `arrayType ${arrayType}`)
  })
})

describe('typeGenerator — transformers', () => {
  test('schema transformer — removes optional properties from object', async () => {
    const removeOptionalProperties: ast.Macro = {
      name: 'remove-optional-properties',
      schema(node) {
        if ('properties' in node) {
          return { ...node, properties: node.properties.filter((p) => p.required) }
        }
        return node
      },
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: defaultOptions, resolver: resolverTs, macros: [removeOptionalProperties] })
    const driver = createMockedPluginDriver({ name: 'transformers removeOptionalProperties' })

    await renderGeneratorSchema(typeGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'transformers removeOptionalProperties')
  })

  test('schema transformer — maps integer type to string', async () => {
    const integerToString: ast.Macro = {
      name: 'integer-to-string',
      schema(node) {
        if (node.type === 'integer') return { ...node, type: 'string' }
        return node
      },
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: defaultOptions, resolver: resolverTs, macros: [integerToString] })
    const driver = createMockedPluginDriver({ name: 'transformers integerToString' })

    const schemaWithInteger = ast.factory.createSchema({
      type: 'object',
      name: 'Order',
      properties: [
        ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) }),
        ast.factory.createProperty({ name: 'quantity', schema: ast.factory.createSchema({ type: 'integer', optional: true }) }),
        ast.factory.createProperty({ name: 'status', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
      ],
    })

    await renderGeneratorSchema(typeGenerator, schemaWithInteger, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'transformers integerToString')
  })
})
