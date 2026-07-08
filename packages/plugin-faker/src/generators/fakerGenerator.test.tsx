import { aliasConflictingImports, rewriteAliasedImports } from '@internals/utils'
import type { Config } from 'kubb/kit'
import { ast, memoryStorage } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation, renderGeneratorSchema } from 'kubb/kit/testing'
import { parserTs } from '@kubb/parser-ts'
import { type PluginTs, resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { format, matchFiles } from '#mocks'
import { resolverFaker } from '../resolvers/resolverFaker.ts'
import type { PluginFaker } from '../types.ts'
import { fakerGenerator } from './fakerGenerator.tsx'

const categorySchema = ast.factory.createSchema({
  type: 'object',
  name: 'Category',
  properties: [ast.factory.createProperty({ name: 'label', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
})

const errorSchema = ast.factory.createSchema({
  type: 'object',
  name: 'Error',
  properties: [ast.factory.createProperty({ name: 'message', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
})

const emojiSchema = ast.factory.createSchema({
  type: 'string',
  name: 'Emoji',
  description: 'Emoji shortcode',
})

const petSchema = ast.factory.createSchema({
  type: 'object',
  name: 'Pet',
  properties: [
    ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) }),
    ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
    ast.factory.createProperty({ name: 'code', schema: ast.factory.createSchema({ type: 'string', pattern: '^[A-Z]{3}$' }) }),
    ast.factory.createProperty({ name: 'shipDate', schema: ast.factory.createSchema({ type: 'date', representation: 'string' }) }),
    ast.factory.createProperty({
      name: 'category',
      schema: ast.factory.createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }),
    }),
    ast.factory.createProperty({
      name: 'status',
      schema: ast.factory.createSchema({
        type: 'enum',
        primitive: 'string',
        enumValues: ['available', 'pending', 'sold'],
      }),
    }),
  ],
})

const treeNodeSchema = ast.factory.createSchema({
  type: 'object',
  name: 'TreeNode',
  properties: [
    ast.factory.createProperty({ name: 'value', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
    ast.factory.createProperty({
      name: 'left',
      schema: ast.factory.createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }),
    }),
    ast.factory.createProperty({
      name: 'right',
      schema: ast.factory.createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }),
    }),
  ],
})

// Indirect/polymorphic circular reference scenario from issue #3172:
// Pet (union) → Cat → Pet → ... causes runtime stack overflow without lazy
// getter support. Cat/Dog reference Pet via array and union members.
const petPolySchema = ast.factory.createSchema({
  type: 'union',
  name: 'Pet',
  members: [
    ast.factory.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' }),
    ast.factory.createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' }),
  ],
})

const catSchema = ast.factory.createSchema({
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

const dogSchema = ast.factory.createSchema({
  type: 'object',
  name: 'Dog',
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

const defaultOptions: PluginFaker['resolvedOptions'] = {
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  dateParser: 'faker',
  regexGenerator: 'faker',
  seed: undefined,
  locale: undefined,
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

  test('macro rewrites a property to fixed enum values (mapper replacement)', async () => {
    const propertyValues: ast.Macro = {
      name: 'property-values',
      schema(node) {
        if ('properties' in node) {
          return {
            ...node,
            properties: node.properties.map((property) =>
              property.name === 'name'
                ? { ...property, schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['working', 'idle'] }) }
                : property,
            ),
          }
        }
        return node
      },
    }
    const resolvedOptions: PluginFaker['resolvedOptions'] = { ...defaultOptions }
    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options: resolvedOptions, resolver: resolverFaker, macros: [propertyValues] })
    const driver = createMockedPluginDriver({
      name: 'petWithMacroValues',
      plugin: defaultTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorSchema(fakerGenerator, petSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: resolvedOptions,
      resolver: resolverFaker,
    })

    await matchFiles(driver.fileManager.files, 'petWithMacroValues')
  })

  test('named string schema omits unused type import', async () => {
    const resolvedOptions: PluginFaker['resolvedOptions'] = { ...defaultOptions }
    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options: resolvedOptions, resolver: resolverFaker })
    const driver = createMockedPluginDriver({
      name: 'emoji',
      plugin: defaultTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

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

    const output = await format(parserTs.parse(file!))

    expect(output).toContain('export function createEmoji(data?: string): string')
    expect(output).not.toContain('import type { Emoji }')
  })
})

describe('fakerGenerator — operation', () => {
  test.each([
    {
      name: 'showPetById',
      node: ast.factory.createOperation({
        operationId: 'showPetById',
        method: 'GET',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            description: 'Expected response to a valid request',
            schema: ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }),
          }),
          ast.factory.createResponse({
            statusCode: 'default',
            description: 'Unexpected error',
            schema: ast.factory.createSchema({ type: 'ref', name: 'Error', ref: '#/components/schemas/Error' }),
          }),
        ],
      }),
      options: {},
    },
    {
      name: 'createPet',
      node: ast.factory.createOperation({
        operationId: 'createPet',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        requestBody: {
          description: 'Pet to add',
          content: [
            ast.factory.createContent({
              contentType: 'application/json',
              schema: ast.factory.createSchema({
                type: 'object',
                properties: [
                  ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
                  ast.factory.createProperty({
                    name: 'category',
                    schema: ast.factory.createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }),
                  }),
                ],
              }),
            }),
          ],
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '201',
            description: 'Created pet',
            schema: ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }),
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
    expect(resolverFaker.name('Eval')).toBe('createEval')
    expect(resolverFaker.file({ name: 'Eval', extname: '.ts', root: '.', output: { path: '.' } }).baseName).toBe('createEval.ts')
  })
})
