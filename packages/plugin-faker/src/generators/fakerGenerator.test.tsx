import { aliasConflictingImports, rewriteAliasedImports } from '@internals/utils'
import type { Config } from '@kubb/core'
import { ast, FileProcessor, memoryStorage } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation, renderGeneratorSchema } from '@kubb/core/mocks'
import { parserTs } from '@kubb/parser-ts'
import { type PluginTs, resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { format, matchFiles } from '#mocks'
import { resolverFaker } from '../resolvers/resolverFaker.ts'
import type { PluginFaker } from '../types.ts'
import { fakerGenerator } from './fakerGenerator.tsx'

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

const emojiSchema = ast.createSchema({
  type: 'string',
  name: 'Emoji',
  description: 'Emoji shortcode',
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

// Indirect/polymorphic circular reference scenario from issue #3172:
// Pet (union) → Cat → Pet → ... causes runtime stack overflow without lazy
// getter support. Cat/Dog reference Pet via array and union members.
const petPolySchema = ast.createSchema({
  type: 'union',
  name: 'Pet',
  members: [
    ast.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' }),
    ast.createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' }),
  ],
})

const catSchema = ast.createSchema({
  type: 'object',
  name: 'Cat',
  properties: [
    ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'integer' }) }),
    ast.createProperty({
      name: 'archEnemy',
      schema: ast.createSchema({
        type: 'union',
        members: [ast.createSchema({ type: 'null' }), ast.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })],
      }),
    }),
    ast.createProperty({
      name: 'friends',
      schema: ast.createSchema({
        type: 'array',
        items: [ast.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })],
      }),
    }),
  ],
})

const dogSchema = ast.createSchema({
  type: 'object',
  name: 'Dog',
  properties: [
    ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'integer' }) }),
    ast.createProperty({
      name: 'archEnemy',
      schema: ast.createSchema({
        type: 'union',
        members: [ast.createSchema({ type: 'null' }), ast.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })],
      }),
    }),
    ast.createProperty({
      name: 'friends',
      schema: ast.createSchema({
        type: 'array',
        items: [ast.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })],
      }),
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
  storage: memoryStorage(),
}

const defaultOptions: PluginFaker['resolvedOptions'] = {
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  mapper: {},
  dateParser: 'faker',
  regexGenerator: 'faker',
  seed: undefined,
  locale: undefined,
  paramsCasing: undefined,
  printer: undefined,
}

const defaultTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: 'types' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
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
    { name: 'catCycle', node: catSchema, options: {} },
    { name: 'petWithLocale', node: petSchema, options: { locale: 'de' as const } },
  ] as const)('$name', async ({ name, node, options }) => {
    const resolvedOptions: PluginFaker['resolvedOptions'] = { ...defaultOptions, ...options }
    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options: resolvedOptions, resolver: resolverFaker })
    const driver = createMockedPluginDriver({
      name,
      plugin: defaultTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorSchema(fakerGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      meta: {
        circularNames: [...ast.findCircularSchemas([categorySchema, emojiSchema, errorSchema, petSchema, treeNodeSchema, petPolySchema, catSchema, dogSchema])],
        enumNames: [],
      },
      driver,
      plugin,
      options: resolvedOptions,
      resolver: resolverFaker,
    })

    await matchFiles(driver.fileManager.files, name)
  })

  test('named string schema omits unused type import', async () => {
    const resolvedOptions: PluginFaker['resolvedOptions'] = { ...defaultOptions }
    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options: resolvedOptions, resolver: resolverFaker })
    const driver = createMockedPluginDriver({ name: 'emoji', plugin: defaultTsPlugin as any })

    await renderGeneratorSchema(fakerGenerator, emojiSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: resolvedOptions,
      resolver: resolverFaker,
    })

    const file = driver.fileManager.files.find((item) => item.baseName === 'createEmoji.ts')
    expect(file).toBeDefined()

    const fileProcessor = new FileProcessor({
      storage: memoryStorage(),
      parsers: new Map([['.ts', parserTs]]),
    })
    const output = await format(fileProcessor.parse(file!))

    expect(output).toContain('export function createEmoji(data?: string): string')
    expect(output).not.toContain('import type { Emoji }')
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
          content: [
            {
              contentType: 'application/json',
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
          ],
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
      adapter: createMockedAdapter(),
      meta: {
        circularNames: [...ast.findCircularSchemas([categorySchema, errorSchema, petSchema, treeNodeSchema])],
        enumNames: [],
      },
      driver,
      plugin,
      options: resolvedOptions,
      resolver: resolverFaker,
    })

    await matchFiles(driver.fileManager.files, name)
  })

  test('aliases imported helpers that collide with operation helper names', () => {
    const { imports, aliases } = aliasConflictingImports(
      [{ name: 'createWidgetResponse', path: './createWidgetResponse.ts' }],
      new Set(['createWidgetResponse']),
    )

    expect(imports).toStrictEqual([
      {
        name: [{ propertyName: 'createWidgetResponse', name: 'createWidgetResponseSchema' }],
        path: './createWidgetResponse.ts',
      },
    ])
    expect(rewriteAliasedImports('return createWidgetResponse(data)', aliases)).toBe('return createWidgetResponseSchema(data)')
  })

  test('default resolver applies create prefix to names', () => {
    expect(resolverFaker.resolveName('Eval')).toBe('createEval')
    expect(resolverFaker.resolvePathName('Eval', 'file')).toBe('createEval')
  })
})
