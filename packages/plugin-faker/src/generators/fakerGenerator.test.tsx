import type { Config } from '@kubb/core'
import { ast } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation, renderGeneratorSchema } from '@kubb/core/mocks'
import { type PluginTs, resolverTs, resolverTsLegacy } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverFaker } from '../resolvers/resolverFaker.ts'
import { resolverFakerLegacy } from '../resolvers/resolverFakerLegacy.ts'
import type { PluginFaker } from '../types.ts'
import { fakerGenerator } from './fakerGenerator.tsx'
import { fakerGeneratorLegacy } from './fakerGeneratorLegacy.tsx'

const categorySchema = ast.createSchema({
  type: 'object',
  name: 'Category',
  properties: [ast.createProperty({ name: 'label', required: true, schema: ast.createSchema({ type: 'string' }) })],
})

const errorSchema = ast.createSchema({
  type: 'object',
  name: 'Error',
  properties: [ast.createProperty({ name: 'message', required: true, schema: ast.createSchema({ type: 'string' }) })],
})

const petSchema = ast.createSchema({
  type: 'object',
  name: 'Pet',
  properties: [
    ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'integer' }) }),
    ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
    ast.createProperty({ name: 'code', schema: ast.createSchema({ type: 'string', pattern: '^[A-Z]{3}$' }) }),
    ast.createProperty({ name: 'shipDate', schema: ast.createSchema({ type: 'date', representation: 'string' }) }),
    ast.createProperty({
      name: 'category',
      schema: ast.createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }),
    }),
    ast.createProperty({
      name: 'status',
      schema: ast.createSchema({
        type: 'enum',
        primitive: 'string',
        enumValues: ['available', 'pending', 'sold'],
      }),
    }),
  ],
})

const treeNodeSchema = ast.createSchema({
  type: 'object',
  name: 'TreeNode',
  properties: [
    ast.createProperty({ name: 'value', required: true, schema: ast.createSchema({ type: 'string' }) }),
    ast.createProperty({
      name: 'left',
      schema: ast.createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }),
    }),
    ast.createProperty({
      name: 'right',
      schema: ast.createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }),
    }),
  ],
})

const testConfig: Config = {
  root: '.',
  input: { path: '' },
  output: { path: 'test' },
  plugins: [],
  parsers: [],
  adapter: createMockedAdapter(),
}

const defaultOptions: PluginFaker['resolvedOptions'] = {
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
  group: undefined,
  mapper: {},
  dateParser: 'faker',
  regexGenerator: 'faker',
  seed: undefined,
  paramsCasing: undefined,
  printer: undefined,
}

const defaultTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: 'types' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const legacyTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: 'types' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTsLegacy,
})

describe('fakerGenerator — schema', () => {
  test.each([
    { name: 'pet', node: petSchema, options: {} },
    { name: 'petWithDayjs', node: petSchema, options: { dateParser: 'dayjs' as const } },
    { name: 'petWithRandExp', node: petSchema, options: { regexGenerator: 'randexp' as const } },
    {
      name: 'petWithMapper',
      node: petSchema,
      options: {
        mapper: {
          name: `faker.string.fromCharacters('abc')`,
        },
      },
    },
    { name: 'treeNode', node: treeNodeSchema, options: {} },
  ] as const)('$name', async ({ name, node, options }) => {
    const resolvedOptions: PluginFaker['resolvedOptions'] = { ...defaultOptions, ...options }
    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options: resolvedOptions, resolver: resolverFaker })
    const driver = createMockedPluginDriver({
      name,
      plugin: defaultTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorSchema(fakerGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter({
        inputNode: {
          kind: 'Input',
          schemas: [categorySchema, errorSchema, petSchema, treeNodeSchema],
          operations: [],
          meta: {},
        },
      }),
      driver,
      plugin,
      options: resolvedOptions,
      resolver: resolverFaker,
    })

    await matchFiles(driver.fileManager.files, name)
  })
})

describe('fakerGenerator — operation', () => {
  test.each([
    {
      name: 'showPetById',
      node: ast.createOperation({
        operationId: 'showPetById',
        method: 'GET',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
        responses: [
          ast.createResponse({
            statusCode: '200',
            description: 'Expected response to a valid request',
            schema: ast.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }),
          }),
          ast.createResponse({
            statusCode: 'default',
            description: 'Unexpected error',
            schema: ast.createSchema({ type: 'ref', name: 'Error', ref: '#/components/schemas/Error' }),
          }),
        ],
      }),
      options: {},
    },
    {
      name: 'createPet',
      node: ast.createOperation({
        operationId: 'createPet',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        requestBody: {
          description: 'Pet to add',
          schema: ast.createSchema({
            type: 'object',
            properties: [
              ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
              ast.createProperty({
                name: 'category',
                schema: ast.createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }),
              }),
            ],
          }),
        },
        responses: [
          ast.createResponse({
            statusCode: '201',
            description: 'Created pet',
            schema: ast.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }),
          }),
        ],
      }),
      options: {},
    },
  ] as const)('$name', async ({ name, node, options }) => {
    const resolvedOptions: PluginFaker['resolvedOptions'] = { ...defaultOptions, ...options }
    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options: resolvedOptions, resolver: resolverFaker })
    const driver = createMockedPluginDriver({
      name,
      plugin: defaultTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(fakerGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter({
        inputNode: {
          kind: 'Input',
          schemas: [categorySchema, errorSchema, petSchema, treeNodeSchema],
          operations: [],
          meta: {},
        },
      }),
      driver,
      plugin,
      options: resolvedOptions,
      resolver: resolverFaker,
    })

    await matchFiles(driver.fileManager.files, name)
  })
})

describe('fakerGeneratorLegacy — operation', () => {
  test('legacy naming and grouped params', async () => {
    const node = ast.createOperation({
      operationId: 'showPetById',
      method: 'GET',
      path: '/pets/{petId}',
      tags: ['pets'],
      parameters: [
        ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true }),
        ast.createParameter({ name: 'includeDetails', in: 'query', schema: ast.createSchema({ type: 'boolean' }) }),
      ],
      responses: [
        ast.createResponse({
          statusCode: '200',
          description: 'Expected response to a valid request',
          schema: ast.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }),
        }),
        ast.createResponse({
          statusCode: 'default',
          description: 'Unexpected error',
          schema: ast.createSchema({ type: 'ref', name: 'Error', ref: '#/components/schemas/Error' }),
        }),
      ],
    })

    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options: defaultOptions, resolver: resolverFakerLegacy })
    const driver = createMockedPluginDriver({
      name: 'legacyShowPetById',
      plugin: legacyTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(fakerGeneratorLegacy, node, {
      config: testConfig,
      adapter: createMockedAdapter({
        inputNode: {
          kind: 'Input',
          schemas: [categorySchema, errorSchema, petSchema, treeNodeSchema],
          operations: [],
          meta: {},
        },
      }),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverFakerLegacy,
    })

    await matchFiles(driver.fileManager.files, 'legacyShowPetById')
  })

  test('legacy resolver prefixes create for schema and operations', () => {
    const node = ast.createOperation({
      operationId: 'addFiles',
      method: 'POST',
      path: '/pet/files',
      tags: ['pets'],
      responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'string' }) })],
    })

    expect(resolverFakerLegacy.resolveName('Address')).toBe('createAddress')
    expect(resolverFakerLegacy.resolvePathName('Address', 'file')).toBe('createAddress')
    expect(resolverFakerLegacy.resolvePathName('addFiles', 'file')).toBe('createAddFiles')
    expect(resolverFakerLegacy.resolveResponseStatusName(node, '200')).toBe('createAddFiles200')
    expect(resolverFakerLegacy.resolveDataName(node)).toBe('createAddFilesMutationRequest')
    expect(resolverFakerLegacy.resolveResponseName(node)).toBe('createAddFilesMutationResponse')
  })

  test('custom resolveName also affects filenames', () => {
    const resolver = {
      ...resolverFakerLegacy,
      resolveName(name: string, type?: 'file' | 'function' | 'type' | 'const') {
        return `${this.default(name, type)}Faker`
      },
    }

    const file = resolver.resolveFile(
      { name: 'addFiles', extname: '.ts', tag: 'pets', path: '/pet/files' },
      {
        root: '.',
        output: { path: 'mocks' },
        group: undefined,
      },
    )

    expect(file.baseName).toBe('createAddFilesFaker.ts')
  })
})
