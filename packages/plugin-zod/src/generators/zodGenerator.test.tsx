import path from 'node:path'
import { camelCase } from '@internals/utils'

import type { Config, Group } from 'kubb/kit'
import { ast, memoryStorage } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation, renderGeneratorSchema } from 'kubb/kit/testing'
import { describe, expect, test } from 'vitest'
import { matchFiles, rawSources } from '#mocks'
import { resolverZod } from '../resolvers/resolverZod.ts'
import type { PluginZod } from '../types.ts'
import { zodGenerator } from './zodGenerator.tsx'

const testConfig: Config = {
  root: '.',
  input: {},
  output: { path: 'test' },
  plugins: [],
  parsers: [],
  reporters: [],
  adapter: createMockedAdapter(),
  storage: memoryStorage(),
}

const defaultOptions: PluginZod['resolvedOptions'] = {
  inferred: false,
  importPath: 'zod',
  coercion: false,
  guidType: 'uuid',
  regexType: 'literal',
  mini: false,
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  printer: undefined,
}

const stringSchema = ast.factory.createSchema({ type: 'string', name: 'PetName' })

const numberSchema = ast.factory.createSchema({ type: 'number', name: 'PetAge' })

const integerSchema = ast.factory.createSchema({ type: 'integer', name: 'PetId' })

const booleanSchema = ast.factory.createSchema({ type: 'boolean', name: 'IsActive' })

const enumSchema = ast.factory.createSchema({
  type: 'enum',
  name: 'PetStatus',
  primitive: 'string',
  enumValues: ['available', 'pending', 'sold'],
})

const objectSchema = ast.factory.createSchema({
  type: 'object',
  primitive: 'object',
  name: 'Pet',
  properties: [
    ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) }),
    ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
    ast.factory.createProperty({ name: 'status', schema: ast.factory.createSchema({ type: 'string', optional: true }) }),
    ast.factory.createProperty({ name: 'tags', schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] }) }),
  ],
})

const arraySchema = ast.factory.createSchema({
  type: 'array',
  name: 'PetList',
  items: [ast.factory.createSchema({ type: 'string' })],
})

const nullableSchema = ast.factory.createSchema({
  type: 'string',
  name: 'NullableString',
  nullable: true,
})

const optionalSchema = ast.factory.createSchema({
  type: 'string',
  name: 'OptionalString',
  optional: true,
})

const unknownSchema = ast.factory.createSchema({ type: 'unknown', name: 'UnknownField' })

const nullishSchema = ast.factory.createSchema({ type: 'string', name: 'NullishString', nullable: true, optional: true })

const unionSchema = ast.factory.createSchema({
  type: 'union',
  name: 'PetOrCat',
  members: [ast.factory.createSchema({ type: 'string' }), ast.factory.createSchema({ type: 'number' })],
})

const discriminatedUnionSchema = ast.factory.createSchema({
  type: 'union',
  name: 'Payment',
  discriminatorPropertyName: 'method',
  members: [
    ast.factory.createSchema({ type: 'ref', name: 'CardPayment', ref: '#/components/schemas/CardPayment' }),
    ast.factory.createSchema({ type: 'ref', name: 'WalletPayment', ref: '#/components/schemas/WalletPayment' }),
  ],
})

const intersectionSchema = ast.factory.createSchema({
  type: 'intersection',
  name: 'PetAndOwner',
  members: [
    ast.factory.createSchema({
      type: 'object',
      primitive: 'object',
      properties: [ast.factory.createProperty({ name: 'petName', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
    }),
    ast.factory.createSchema({
      type: 'object',
      primitive: 'object',
      properties: [ast.factory.createProperty({ name: 'ownerName', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
    }),
  ],
})

const schemaWithDescription = ast.factory.createSchema({
  type: 'string',
  name: 'LabelField',
  description: 'A human-readable label',
})

const schemaWithDefault = ast.factory.createSchema({
  type: 'string',
  name: 'StatusField',
  default: 'active',
})

const schemaWithPattern = ast.factory.createSchema({
  type: 'string',
  name: 'SlugField',
  pattern: '^[a-z0-9-]+$',
})

const additionalPropertiesObjectSchema = ast.factory.createSchema({
  type: 'object',
  primitive: 'object',
  name: 'MetaMap',
  properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) })],
  additionalProperties: ast.factory.createSchema({ type: 'string' }),
})

const operationWithSnakeCaseParams: ast.OperationNode = ast.factory.createOperation({
  operationId: 'updatePet',
  method: 'POST',
  path: '/pets/{pet_id}',
  tags: ['pets'],
  parameters: [
    ast.factory.createParameter({ name: 'pet_id', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
    ast.factory.createParameter({ name: 'include_deleted', in: 'query', schema: ast.factory.createSchema({ type: 'boolean' }) }),
  ],
  requestBody: {
    content: [
      ast.factory.createContent({
        contentType: 'application/json',
        schema: ast.factory.createSchema({
          type: 'object',
          primitive: 'object',
          properties: [ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
        }),
      }),
    ],
  },
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
      description: 'Success',
    }),
  ],
})

describe('zodGenerator — Schema', () => {
  const schemas: Array<{ name: string; node: ast.SchemaNode; options?: Partial<PluginZod['resolvedOptions']> }> = [
    { name: 'string', node: stringSchema },
    { name: 'number', node: numberSchema },
    { name: 'integer', node: integerSchema },
    { name: 'boolean', node: booleanSchema },
    { name: 'enum', node: enumSchema },
    { name: 'object', node: objectSchema },
    { name: 'array', node: arraySchema },
    { name: 'nullable', node: nullableSchema },
    { name: 'optional', node: optionalSchema },
    // dateType — printer renders based on representation, integration tests cover adapter-level dateType option
    { name: 'dateType string', node: ast.factory.createSchema({ type: 'date', name: 'DateField', representation: 'string' }) },
    { name: 'dateType date', node: ast.factory.createSchema({ type: 'date', name: 'DateField', representation: 'date' }) },
    // guidType options
    { name: 'guidType uuid', node: ast.factory.createSchema({ type: 'uuid', name: 'UuidField' }), options: { guidType: 'uuid' } },
    { name: 'guidType guid', node: ast.factory.createSchema({ type: 'uuid', name: 'GuidField' }), options: { guidType: 'guid' } },
    // coercion options
    { name: 'coercion true', node: objectSchema, options: { coercion: true } },
    { name: 'coercion strings', node: stringSchema, options: { coercion: { strings: true } } },
    { name: 'coercion numbers', node: numberSchema, options: { coercion: { numbers: true } } },
    {
      name: 'coercion dates',
      node: ast.factory.createSchema({ type: 'date', name: 'DateField', representation: 'date' }),
      options: { coercion: { dates: true } },
    },
    // inferred
    { name: 'inferred', node: stringSchema, options: { inferred: true } },
    // inferred all-uppercase name — const and type must not collide (issue #332)
    {
      name: 'inferred all-uppercase',
      node: ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        name: 'SUV',
        properties: [ast.factory.createProperty({ name: 'offroadCapability', schema: ast.factory.createSchema({ type: 'boolean', optional: true }) })],
      }),
      options: { inferred: true },
    },
    // mini mode
    { name: 'mini', node: objectSchema, options: { mini: true, importPath: 'zod/mini' } },
    { name: 'mini nullable', node: nullableSchema, options: { mini: true, importPath: 'zod/mini' } },
    { name: 'mini optional', node: optionalSchema, options: { mini: true, importPath: 'zod/mini' } },
    { name: 'mini inferred', node: stringSchema, options: { mini: true, importPath: 'zod/mini', inferred: true } },
    // unknownType — adapter-level option; here we test that each AST node type renders correctly
    { name: 'unknownType any', node: unknownSchema },
    { name: 'unknownType unknown', node: ast.factory.createSchema({ type: 'unknown', name: 'UnknownField2' }) },
    { name: 'unknownType void', node: ast.factory.createSchema({ type: 'void', name: 'VoidField' }) },
    // integerType is an adapter-level option; the AST node type is already resolved to 'integer' or 'bigint'
    { name: 'bigint', node: ast.factory.createSchema({ type: 'bigint', name: 'PetId', primitive: 'integer' }) },
    // importPath custom
    { name: 'importPath custom', node: stringSchema, options: { importPath: '@acme/zod' } },
    // printer override wrapping the built-in handler via this.base
    {
      name: 'printer base wrap',
      node: ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        name: 'WrappedPet',
        properties: [
          ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
          ast.factory.createProperty({ name: 'age', schema: ast.factory.createSchema({ type: 'integer', optional: true }) }),
        ],
      }),
      options: {
        printer: {
          nodes: {
            object(node) {
              return `${this.base(node)}.openapi('WrappedPet')`
            },
          },
        },
      },
    },
    // nullish (nullable + optional)
    { name: 'nullish', node: nullishSchema },
    // composite schemas
    { name: 'union', node: unionSchema },
    { name: 'discriminatedUnion', node: discriminatedUnionSchema },
    { name: 'intersection', node: intersectionSchema },
    // schema with description
    { name: 'description', node: schemaWithDescription },
    // schema with default value
    { name: 'default', node: schemaWithDefault },
    // schema with pattern/regex
    { name: 'pattern', node: schemaWithPattern },
    // regexType: constructor emits new RegExp(...) instead of a regex literal
    { name: 'regexType constructor', node: schemaWithPattern, options: { regexType: 'constructor' } },
    // object with additionalProperties
    { name: 'additionalProperties', node: additionalPropertiesObjectSchema },
    // datetime variants
    { name: 'dateType stringOffset', node: ast.factory.createSchema({ type: 'datetime', name: 'DatetimeOffset', offset: true }) },
    { name: 'dateType stringLocal', node: ast.factory.createSchema({ type: 'datetime', name: 'DatetimeLocal', local: true }) },
    // mini — additional schema types
    { name: 'mini union', node: unionSchema, options: { mini: true, importPath: 'zod/mini' } },
    { name: 'mini discriminatedUnion', node: discriminatedUnionSchema, options: { mini: true, importPath: 'zod/mini' } },
    {
      name: 'mini printer base wrap',
      node: stringSchema,
      options: {
        mini: true,
        importPath: 'zod/mini',
        printer: {
          nodes: {
            string(node) {
              return `${this.base(node)}.openapi('test')`
            },
          },
        },
      },
    },
  ]

  // Indirect/polymorphic circular reference scenario from issue #3172:
  // Pet (union) → Cat → Pet → ... causes runtime stack overflow without lazy getter support.
  const petPolySchema = ast.factory.createSchema({
    type: 'union',
    name: 'Pet',
    members: [
      ast.factory.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' }),
      ast.factory.createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' }),
    ],
  })

  const catCycleSchema = ast.factory.createSchema({
    type: 'object',
    name: 'Cat',
    properties: [
      ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) }),
      ast.factory.createProperty({
        name: 'archEnemy',
        schema: ast.factory.createSchema({
          type: 'union',
          members: [ast.factory.createSchema({ type: 'null' }), ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })],
        }),
      }),
      ast.factory.createProperty({
        name: 'friends',
        schema: ast.factory.createSchema({
          type: 'array',
          items: [ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })],
        }),
      }),
    ],
  })

  test.each(schemas)('$name', async (props) => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderGeneratorSchema(zodGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver: resolverZod,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })

  test('catCycle — indirect circular ref uses getter syntax (issue #3172)', async () => {
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: 'catCycle' })

    await renderGeneratorSchema(zodGenerator, catCycleSchema, {
      config: testConfig,
      adapter: createMockedAdapter({
        resolvedOptions: { dateType: 'string' },
      }),
      meta: {
        circularNames: [...ast.findCircularSchemas([petPolySchema, catCycleSchema])],
        enumNames: [],
      },
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverZod,
    })

    await matchFiles(driver.fileManager.files, 'catCycle')
  })

  // A directly self-referential schema (its own initializer references itself, like discord's
  // errorDetailsSchema) is implicitly `any` under strict (TS7022), so it must be annotated
  // `: z.ZodType`. This is the inverse of catCycle, whose object getters defer the self-reference.
  const errorDetailsSchema = ast.factory.createSchema({
    type: 'union',
    name: 'ErrorDetails',
    members: [
      ast.factory.createSchema({ type: 'ref', name: 'ErrorDetails', ref: '#/components/schemas/ErrorDetails' }),
      ast.factory.createSchema({ type: 'string' }),
    ],
  })

  test('selfRefCycle — directly self-referential schema is annotated z.ZodType', async () => {
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: 'selfRefCycle' })

    await renderGeneratorSchema(zodGenerator, errorDetailsSchema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      meta: {
        circularNames: [...ast.findCircularSchemas([errorDetailsSchema])],
        enumNames: [],
      },
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverZod,
    })

    const source = rawSources(driver.fileManager.files).join('\n')
    expect(source).toContain('export const errorDetailsSchema: z.ZodType')
  })
})

describe('zodGenerator — Operation', () => {
  const operations: Array<{ name: string; node: ast.OperationNode; options?: Partial<PluginZod['resolvedOptions']> }> = [
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
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'A paged array of pets',
          }),
          ast.factory.createResponse({
            statusCode: 'default',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
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
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Expected response',
          }),
          ast.factory.createResponse({
            statusCode: 'default',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Unexpected error',
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
        requestBody: {
          content: [
            ast.factory.createContent({
              contentType: 'application/json',
              schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            }),
          ],
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Successful operation',
          }),
          ast.factory.createResponse({
            statusCode: '405',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Invalid input',
          }),
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
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Successful operation',
          }),
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
          content: [
            ast.factory.createContent({
              contentType: 'application/json',
              schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [], description: 'Order payload' }),
            }),
          ],
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Successful operation',
          }),
          ast.factory.createResponse({
            statusCode: '405',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Invalid input',
          }),
        ],
      }),
    },
    {
      name: 'noTagsOperation — GET with no tags',
      node: ast.factory.createOperation({
        operationId: 'getConfig',
        method: 'GET',
        path: '/config',
        tags: [],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Config',
          }),
        ],
      }),
    },
    {
      name: 'getPets — GET with header params',
      node: ast.factory.createOperation({
        operationId: 'getPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [
          ast.factory.createParameter({ name: 'X-Request-Id', in: 'header', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
          ast.factory.createParameter({ name: 'X-Correlation-Id', in: 'header', schema: ast.factory.createSchema({ type: 'string' }) }),
        ],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Pets',
          }),
        ],
      }),
    },
    {
      name: 'addPet — POST mini mode',
      node: ast.factory.createOperation({
        operationId: 'addPetMini',
        method: 'POST',
        path: '/pet',
        tags: ['pet'],
        requestBody: {
          content: [
            ast.factory.createContent({
              contentType: 'application/json',
              schema: ast.factory.createSchema({
                type: 'object',
                primitive: 'object',
                properties: [ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
              }),
            }),
          ],
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Created',
          }),
        ],
      }),
      options: { mini: true, importPath: 'zod/mini' },
    },
    {
      name: 'listPets — GET inferred',
      node: ast.factory.createOperation({
        operationId: 'listPetsInferred',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) })],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Pets list',
          }),
        ],
      }),
      options: { inferred: true },
    },
    {
      name: 'createPet — POST with coercion',
      node: ast.factory.createOperation({
        operationId: 'createPet',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        requestBody: {
          content: [
            ast.factory.createContent({
              contentType: 'application/json',
              schema: ast.factory.createSchema({
                type: 'object',
                primitive: 'object',
                properties: [
                  ast.factory.createProperty({ name: 'age', required: true, schema: ast.factory.createSchema({ type: 'number' }) }),
                  ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
                ],
              }),
            }),
          ],
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '201',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Created',
          }),
        ],
      }),
      options: { coercion: true },
    },
  ]

  test.each(operations)('$name', async (props) => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderGeneratorOperation(zodGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver: resolverZod,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})

describe('zodGenerator — Operation — group', () => {
  const node = ast.factory.createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    parameters: [ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) })],
    responses: [
      ast.factory.createResponse({
        statusCode: '200',
        schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
        description: 'A paged array of pets',
      }),
      ast.factory.createResponse({
        statusCode: 'default',
        schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
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
      expectedBaseName: 'listPetsSchema.ts',
      expectedDir: 'petsController',
    },
    { group: null, expectedBaseName: 'listPetsSchema.ts', expectedDir: undefined },
  ] satisfies Array<{
    group: Group | null
    expectedBaseName: string
    expectedDir: string | undefined
  }>)('group=$group.type — file path is computed correctly', async ({ group, expectedBaseName, expectedDir }) => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, group }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: 'listPets', config: testConfig })

    await renderGeneratorOperation(zodGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver: resolverZod,
    })

    const file = driver.fileManager.files.find((f: ast.FileNode) => f.baseName === expectedBaseName)
    expect(file).toBeDefined()
    const root = path.resolve(testConfig.root, testConfig.output.path, options.output.path)
    const expectedPath = expectedDir ? path.resolve(root, expectedDir, expectedBaseName) : path.resolve(root, expectedBaseName)
    expect(file!.path).toBe(expectedPath)
  })
})

describe('zodGenerator — params casing', () => {
  test('snake_case params are always converted to camelCase', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: 'paramsCasing camelcase' })

    await renderGeneratorOperation(zodGenerator, operationWithSnakeCaseParams, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver: resolverZod,
    })

    await matchFiles(driver.fileManager.files, 'paramsCasing camelcase')
  })
})

describe('zodGenerator — transformers', () => {
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
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: resolverZod, macros: [removeOptionalProperties] })
    const driver = createMockedPluginDriver({ name: 'transformers removeOptionalProperties' })

    await renderGeneratorSchema(zodGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverZod,
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
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: resolverZod, macros: [integerToString] })
    const driver = createMockedPluginDriver({ name: 'transformers integerToString' })

    const schemaWithInteger = ast.factory.createSchema({
      type: 'object',
      primitive: 'object',
      name: 'Order',
      properties: [
        ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) }),
        ast.factory.createProperty({ name: 'quantity', schema: ast.factory.createSchema({ type: 'integer', optional: true }) }),
        ast.factory.createProperty({ name: 'status', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
      ],
    })

    await renderGeneratorSchema(zodGenerator, schemaWithInteger, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverZod,
    })

    await matchFiles(driver.fileManager.files, 'transformers integerToString')
  })
})
