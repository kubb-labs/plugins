import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { ast, Resolver } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation, renderGeneratorSchema } from 'kubb/kit/testing'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as zMini from 'zod/mini'
import { matchFiles, rawSources, testConfig } from '#mocks'
import type { PrinterZodNodes } from '../printers/printerZod.ts'
import { resolverZod } from '../resolvers/resolverZod.ts'
import type { PluginZod } from '../types.ts'
import { zodGenerator } from './zodGenerator.tsx'

const temporalNodes: PrinterZodNodes = {
  time() {
    return this.options.direction === 'encode'
      ? 'z.instanceof(Temporal.PlainTime).transform((value) => value.toString())'
      : 'z.iso.time().transform((value) => Temporal.PlainTime.from(value))'
  },
}

const defaultOptions: PluginZod['resolvedOptions'] = {
  inferred: false,
  importPath: 'zod',
  coercion: false,
  guidType: 'uuid',
  regexType: 'literal',
  oneOfType: 'union',
  mini: false,
  output: { path: '.', mode: 'directory' },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  printer: undefined,
  typeGuards: false,
  compile: false,
}

const stringSchema = ast.factory.createSchema({ type: ast.schemaTypes.string, name: 'PetName' })

const numberSchema = ast.factory.createSchema({ type: ast.schemaTypes.number, name: 'PetAge' })

const integerSchema = ast.factory.createSchema({ type: ast.schemaTypes.integer, name: 'PetId' })

const booleanSchema = ast.factory.createSchema({ type: ast.schemaTypes.boolean, name: 'IsActive' })

const enumSchema = ast.factory.createSchema({
  type: ast.schemaTypes.enum,
  name: 'PetStatus',
  primitive: ast.schemaTypes.string,
  enumValues: ['available', 'pending', 'sold'],
})

const objectSchema = ast.factory.createSchema({
  type: ast.schemaTypes.object,
  primitive: ast.schemaTypes.object,
  name: 'Pet',
  properties: [
    ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.integer }) }),
    ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) }),
    ast.factory.createProperty({ name: 'status', schema: ast.factory.createSchema({ type: ast.schemaTypes.string, optional: true }) }),
    ast.factory.createProperty({
      name: 'tags',
      schema: ast.factory.createSchema({ type: ast.schemaTypes.array, items: [ast.factory.createSchema({ type: ast.schemaTypes.string })] }),
    }),
  ],
})

const arraySchema = ast.factory.createSchema({
  type: ast.schemaTypes.array,
  name: 'PetList',
  items: [ast.factory.createSchema({ type: ast.schemaTypes.string })],
})

const unionSchema = ast.factory.createSchema({
  type: ast.schemaTypes.union,
  name: 'PetOrCat',
  members: [ast.factory.createSchema({ type: ast.schemaTypes.string }), ast.factory.createSchema({ type: ast.schemaTypes.number })],
})

const discriminatedUnionSchema = ast.factory.createSchema({
  type: ast.schemaTypes.union,
  name: 'Payment',
  discriminatorPropertyName: 'method',
  members: [
    ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'CardPayment', ref: '#/components/schemas/CardPayment' }),
    ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'WalletPayment', ref: '#/components/schemas/WalletPayment' }),
  ],
})

const intersectionSchema = ast.factory.createSchema({
  type: ast.schemaTypes.intersection,
  name: 'PetAndOwner',
  members: [
    ast.factory.createSchema({
      type: ast.schemaTypes.object,
      primitive: ast.schemaTypes.object,
      properties: [ast.factory.createProperty({ name: 'petName', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) })],
    }),
    ast.factory.createSchema({
      type: ast.schemaTypes.object,
      primitive: ast.schemaTypes.object,
      properties: [ast.factory.createProperty({ name: 'ownerName', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) })],
    }),
  ],
})

const schemaWithPattern = ast.factory.createSchema({
  type: ast.schemaTypes.string,
  name: 'SlugField',
  pattern: '^[a-z0-9-]+$',
})

const additionalPropertiesObjectSchema = ast.factory.createSchema({
  type: ast.schemaTypes.object,
  primitive: ast.schemaTypes.object,
  name: 'MetaMap',
  properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.integer }) })],
  additionalProperties: ast.factory.createSchema({ type: ast.schemaTypes.string }),
})

describe('zodGenerator — Schema', () => {
  test.each([false, true])('generates sibling properties for oneOf with mini=%s', async (mini) => {
    const adapter = adapterOas({ validate: false })
    const root = await adapter.parse({
      type: 'data',
      data: {
        openapi: '3.0.0',
        info: { title: 'oneOf siblings', version: '1' },
        paths: {},
        components: {
          schemas: {
            Pet: {
              type: 'object',
              required: ['a', 'shared'],
              properties: { a: { type: 'string' }, shared: { type: 'string' } },
              oneOf: [
                { type: 'object', properties: { a: { type: 'string' } } },
                { type: 'object', properties: { b: { type: 'string' } } },
              ],
            },
          },
        },
      },
    })
    const options = { ...defaultOptions, mini, importPath: mini ? 'zod/mini' : 'zod' }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: 'oneOfSiblings' })
    await renderGeneratorSchema(zodGenerator, root.schemas[0]!, {
      config: testConfig,
      adapter,
      driver,
      plugin,
      options,
      resolver,
    })
    const source = rawSources(driver.fileManager.files)[0]!
    const expression = source.slice(source.indexOf('export const petSchema =') + 'export const petSchema ='.length)
    const schema: z.ZodType = new Function('z', `return ${expression}`)(mini ? zMini : z)

    expect(schema.safeParse({ a: 'x', shared: 'y' }).success).toBe(true)
    expect(schema.safeParse({ shared: 'y' }).success).toBe(false)
    expect(schema.safeParse({ b: 'x', shared: 'y' }).success).toBe(false)
    expect(schema.safeParse({ a: 1, shared: 'y' }).success).toBe(false)
  })

  const schemas: Array<{ name: string; node: ast.SchemaNode; options?: Partial<PluginZod['resolvedOptions']> }> = [
    { name: 'string', node: stringSchema },
    { name: 'number', node: numberSchema },
    { name: 'integer', node: integerSchema },
    { name: 'boolean', node: booleanSchema },
    { name: 'enum', node: enumSchema },
    { name: 'object', node: objectSchema },
    { name: 'array', node: arraySchema },
    // dateType — printer renders based on representation, integration tests cover adapter-level dateType option
    { name: 'dateType string', node: ast.factory.createSchema({ type: ast.schemaTypes.date, name: 'DateField', representation: 'string' }) },
    { name: 'dateType date', node: ast.factory.createSchema({ type: ast.schemaTypes.date, name: 'DateField', representation: 'date' }) },
    // a component whose only convertible field is a `time` still needs an input (encode) variant
    {
      name: 'timeType date object',
      node: ast.factory.createSchema({
        type: ast.schemaTypes.object,
        primitive: ast.schemaTypes.object,
        name: 'Slot',
        properties: [
          ast.factory.createProperty({
            name: 'startsAt',
            required: true,
            schema: ast.factory.createSchema({ type: ast.schemaTypes.time, representation: 'date' }),
          }),
        ],
      }),
    },
    // guidType options
    { name: 'guidType guid', node: ast.factory.createSchema({ type: ast.schemaTypes.uuid, name: 'GuidField' }), options: { guidType: 'guid' } },
    // coercion options
    { name: 'coercion true', node: objectSchema, options: { coercion: true } },
    // inferred
    { name: 'inferred', node: stringSchema, options: { inferred: true } },
    // inferred all-uppercase name — const and type must not collide (issue #332)
    {
      name: 'inferred all-uppercase',
      node: ast.factory.createSchema({
        type: ast.schemaTypes.object,
        primitive: ast.schemaTypes.object,
        name: 'SUV',
        properties: [
          ast.factory.createProperty({ name: 'offroadCapability', schema: ast.factory.createSchema({ type: ast.schemaTypes.boolean, optional: true }) }),
        ],
      }),
      options: { inferred: true },
    },
    // mini mode
    { name: 'mini', node: objectSchema, options: { mini: true, importPath: 'zod/mini' } },
    { name: 'mini inferred', node: stringSchema, options: { mini: true, importPath: 'zod/mini', inferred: true } },
    // importPath custom
    { name: 'importPath custom', node: stringSchema, options: { importPath: '@acme/zod' } },
    // printer override wrapping the built-in handler via this.base
    {
      name: 'printer base wrap',
      node: ast.factory.createSchema({
        type: ast.schemaTypes.object,
        primitive: ast.schemaTypes.object,
        name: 'WrappedPet',
        properties: [
          ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) }),
          ast.factory.createProperty({ name: 'age', schema: ast.factory.createSchema({ type: ast.schemaTypes.integer, optional: true }) }),
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
    // composite schemas
    { name: 'union', node: unionSchema },
    { name: 'discriminatedUnion', node: discriminatedUnionSchema },
    { name: 'intersection', node: intersectionSchema },
    // regexType: constructor emits new RegExp(...) instead of a regex literal
    { name: 'regexType constructor', node: schemaWithPattern, options: { regexType: 'constructor' } },
    // object with additionalProperties
    { name: 'additionalProperties', node: additionalPropertiesObjectSchema },
    // mini — additional schema types
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
    type: ast.schemaTypes.union,
    name: 'Pet',
    members: [
      ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'Cat', ref: '#/components/schemas/Cat' }),
      ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'Dog', ref: '#/components/schemas/Dog' }),
    ],
  })

  const catCycleSchema = ast.factory.createSchema({
    type: ast.schemaTypes.object,
    name: 'Cat',
    properties: [
      ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.integer }) }),
      ast.factory.createProperty({
        name: 'archEnemy',
        schema: ast.factory.createSchema({
          type: ast.schemaTypes.union,
          members: [
            ast.factory.createSchema({ type: ast.schemaTypes.null }),
            ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'Pet', ref: '#/components/schemas/Pet' }),
          ],
        }),
      }),
      ast.factory.createProperty({
        name: 'friends',
        schema: ast.factory.createSchema({
          type: ast.schemaTypes.array,
          items: [ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'Pet', ref: '#/components/schemas/Pet' })],
        }),
      }),
    ],
  })

  test.each(schemas)('$name', async (props) => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderGeneratorSchema(zodGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })

  test('catCycle — indirect circular ref uses getter syntax (issue #3172)', async () => {
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver })
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
      resolver,
    })

    await matchFiles(driver.fileManager.files, 'catCycle')
  })

  // A directly self-referential schema (its own initializer references itself, like discord's
  // errorDetailsSchema) is implicitly `any` under strict (TS7022), so it must be annotated
  // `: z.ZodType`. This is the inverse of catCycle, whose object getters defer the self-reference.
  const errorDetailsSchema = ast.factory.createSchema({
    type: ast.schemaTypes.union,
    name: 'ErrorDetails',
    members: [
      ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'ErrorDetails', ref: '#/components/schemas/ErrorDetails' }),
      ast.factory.createSchema({ type: ast.schemaTypes.string }),
    ],
  })

  test('selfRefCycle — directly self-referential schema is annotated z.ZodType', async () => {
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver })
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
      resolver,
    })

    const source = rawSources(driver.fileManager.files).join('\n')
    expect(source).toContain('export const errorDetailsSchema: z.ZodType')
  })

  test.each(
    [false, true].flatMap((required) => [{}, { nullable: true }, { optional: true }, { nullish: true }].map((itemModifiers) => ({ required, itemModifiers }))),
  )('nullable recursive object typechecks and validates with required=$required and itemModifiers=$itemModifiers', async ({ required, itemModifiers }) => {
    const node = ast.factory.createSchema({
      type: ast.schemaTypes.object,
      name: 'Foo',
      nullable: true,
      description: 'This is Foo schema.',
      properties: [
        ast.factory.createProperty({
          name: 'baz',
          required,
          schema: ast.factory.createSchema({
            type: ast.schemaTypes.array,
            description: 'This is baz property.',
            items: [ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'Foo', ref: '#/components/schemas/Foo', ...itemModifiers })],
          }),
        }),
      ],
    })
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver })
    const driver = createMockedPluginDriver({ name: 'nullableRecursive' })
    await renderGeneratorSchema(zodGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      meta: { circularNames: [...ast.findCircularSchemas([node])], enumNames: [] },
      driver,
      plugin,
      options: defaultOptions,
      resolver,
    })

    const source = rawSources(driver.fileManager.files).join('\n')
    expect(source).toContain(required ? 'get baz(): z.ZodArray<typeof fooSchema>' : 'get baz(): z.ZodOptional<z.ZodArray<typeof fooSchema>>')
    expect(source).toContain('return z.array(fooSchema)')
    const directory = await fs.mkdtemp(path.join(path.dirname(fileURLToPath(import.meta.url)), '.nullable-recursive-'))
    try {
      const file = path.join(directory, 'schema.ts')
      await fs.writeFile(
        file,
        `${source}
const value: z.infer<typeof fooSchema> = { baz: [null, { baz: [] }] }
// @ts-expect-error The schema retains its object type.
const invalid: z.infer<typeof fooSchema> = 42
if (!fooSchema.safeParse(null).success || !fooSchema.safeParse(value).success || fooSchema.safeParse({ baz: ['invalid'] }).success) throw new Error('Invalid recursive validation')
if (fooSchema.safeParse({}).success !== ${!required}) throw new Error('Invalid required property')
`,
      )
      const compiler = path.join(path.dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin/tsc')
      execFileSync(process.execPath, [compiler, '--ignoreConfig', '--strict', '--skipLibCheck', '--module', 'nodenext', '--target', 'es2022', file], {
        stdio: 'inherit',
      })
      execFileSync(process.execPath, [path.join(directory, 'schema.js')], { stdio: 'pipe' })
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
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
        parameters: [ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: ast.schemaTypes.integer }) })],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
            description: 'A paged array of pets',
          }),
          ast.factory.createResponse({
            statusCode: 'default',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
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
        parameters: [
          ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: ast.schemaTypes.string }), required: true }),
        ],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
            description: 'Expected response',
          }),
          ast.factory.createResponse({
            statusCode: 'default',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
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
              schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
            }),
          ],
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
            description: 'Successful operation',
          }),
          ast.factory.createResponse({
            statusCode: '405',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
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
        parameters: [
          ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: ast.schemaTypes.string }), required: true }),
        ],
        responses: [
          ast.factory.createResponse({ statusCode: '204', description: 'No content', schema: ast.factory.createSchema({ type: ast.schemaTypes.void }) }),
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
            schema: ast.factory.createSchema({ type: ast.schemaTypes.enum, primitive: ast.schemaTypes.string, enumValues: ['available', 'pending', 'sold'] }),
          }),
        ],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
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
        parameters: [
          ast.factory.createParameter({ name: 'orderId', in: 'path', schema: ast.factory.createSchema({ type: ast.schemaTypes.integer }), required: true }),
        ],
        requestBody: {
          content: [
            ast.factory.createContent({
              contentType: 'application/json',
              schema: ast.factory.createSchema({
                type: ast.schemaTypes.object,
                primitive: ast.schemaTypes.object,
                properties: [],
                description: 'Order payload',
              }),
            }),
          ],
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
            description: 'Successful operation',
          }),
          ast.factory.createResponse({
            statusCode: '405',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
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
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
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
          ast.factory.createParameter({
            name: 'X-Request-Id',
            in: 'header',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.string }),
            required: true,
          }),
          ast.factory.createParameter({ name: 'X-Correlation-Id', in: 'header', schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) }),
        ],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
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
                type: ast.schemaTypes.object,
                primitive: ast.schemaTypes.object,
                properties: [ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) })],
              }),
            }),
          ],
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
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
        parameters: [ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: ast.schemaTypes.integer }) })],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
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
                type: ast.schemaTypes.object,
                primitive: ast.schemaTypes.object,
                properties: [
                  ast.factory.createProperty({ name: 'age', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.number }) }),
                  ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) }),
                ],
              }),
            }),
          ],
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '201',
            schema: ast.factory.createSchema({ type: ast.schemaTypes.object, primitive: ast.schemaTypes.object, properties: [] }),
            description: 'Created',
          }),
        ],
      }),
      options: { coercion: true },
    },
    // The `$ref` half needs a resolvable component registry, so the real-spec config in
    // tests/3.0.x covers that instead.
    {
      name: 'direction-branching printer node prints both directions',
      node: ast.factory.createOperation({
        operationId: 'bookSlot',
        method: 'POST',
        path: '/slots',
        tags: ['slots'],
        requestBody: {
          content: [
            ast.factory.createContent({
              contentType: 'application/json',
              schema: ast.factory.createSchema({
                type: ast.schemaTypes.object,
                primitive: ast.schemaTypes.object,
                properties: [
                  ast.factory.createProperty({
                    name: 'startsAt',
                    required: true,
                    schema: ast.factory.createSchema({ type: ast.schemaTypes.time, representation: 'string' }),
                  }),
                ],
              }),
            }),
          ],
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '201',
            schema: ast.factory.createSchema({
              type: ast.schemaTypes.object,
              primitive: ast.schemaTypes.object,
              properties: [
                ast.factory.createProperty({
                  name: 'startsAt',
                  required: true,
                  schema: ast.factory.createSchema({ type: ast.schemaTypes.time, representation: 'string' }),
                }),
              ],
            }),
            description: 'Booked',
          }),
        ],
      }),
      options: { printer: { nodes: temporalNodes } },
    },
  ]

  test.each(operations)('$name', async (props) => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderGeneratorOperation(zodGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })

    await matchFiles(driver.fileManager.files, props.name)
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
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver, macros: [removeOptionalProperties] })
    const driver = createMockedPluginDriver({ name: 'transformers removeOptionalProperties' })

    await renderGeneratorSchema(zodGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options: defaultOptions,
      resolver,
    })

    await matchFiles(driver.fileManager.files, 'transformers removeOptionalProperties')
  })

  test('schema transformer — maps integer type to string', async () => {
    const integerToString: ast.Macro = {
      name: 'integer-to-string',
      schema(node) {
        if (node.type === ast.schemaTypes.integer) return { ...node, type: ast.schemaTypes.string }
        return node
      },
    }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver, macros: [integerToString] })
    const driver = createMockedPluginDriver({ name: 'transformers integerToString' })

    const schemaWithInteger = ast.factory.createSchema({
      type: ast.schemaTypes.object,
      primitive: ast.schemaTypes.object,
      name: 'Order',
      properties: [
        ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.integer }) }),
        ast.factory.createProperty({ name: 'quantity', schema: ast.factory.createSchema({ type: ast.schemaTypes.integer, optional: true }) }),
        ast.factory.createProperty({ name: 'status', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) }),
      ],
    })

    await renderGeneratorSchema(zodGenerator, schemaWithInteger, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options: defaultOptions,
      resolver,
    })

    await matchFiles(driver.fileManager.files, 'transformers integerToString')
  })
})

describe('zodGenerator — inferred aliases', () => {
  const slotSchema = ast.factory.createSchema({
    type: ast.schemaTypes.object,
    primitive: ast.schemaTypes.object,
    name: 'Slot',
    properties: [
      ast.factory.createProperty({
        name: 'startsAt',
        required: true,
        schema: ast.factory.createSchema({ type: ast.schemaTypes.time, representation: 'string' }),
      }),
    ],
  })

  const bookSlot = ast.factory.createOperation({
    operationId: 'bookSlot',
    method: 'POST',
    path: '/slots/{day}',
    tags: ['slots'],
    parameters: [ast.factory.createParameter({ name: 'day', in: 'path', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) })],
    requestBody: { content: [ast.factory.createContent({ contentType: 'application/json', schema: slotSchema })] },
    responses: [ast.factory.createResponse({ statusCode: '200', schema: slotSchema, description: 'ok' })],
  })

  function resolveOptions(inferred: PluginZod['resolvedOptions']['inferred']): PluginZod['resolvedOptions'] {
    return { ...defaultOptions, inferred, printer: { nodes: temporalNodes } }
  }

  async function renderSchema(node: ast.SchemaNode, options: PluginZod['resolvedOptions']) {
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: `alias-${node.name}` })
    await renderGeneratorSchema(zodGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })
    return rawSources(driver.fileManager.files)[0]
  }

  async function renderOperation(node: ast.OperationNode, options: PluginZod['resolvedOptions']) {
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: `alias-${node.operationId}` })
    await renderGeneratorOperation(zodGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })
    return rawSources(driver.fileManager.files)[0]
  }

  // A custom `format: uri` codec: `URL` is the domain value, its string the wire value. Request schemas take
  // the `URL` and transform it to the wire string, response schemas transform the wire string back.
  const encodeUrl = 'z.instanceof(URL).transform((url) => url.href)'
  const decodeUrl = 'z.url().transform((value) => new URL(value))'
  const urlCodec: PrinterZodNodes = {
    url() {
      return this.options.direction === 'encode' ? encodeUrl : decodeUrl
    },
  }

  const getResource = ast.factory.createOperation({
    operationId: 'getResource',
    method: 'GET',
    path: '/resources/{resource}',
    tags: ['resources'],
    parameters: [
      ast.factory.createParameter({ name: 'resource', in: 'path', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.url }) }),
    ],
    responses: [
      ast.factory.createResponse({
        statusCode: '200',
        description: 'ok',
        schema: ast.factory.createSchema({
          type: ast.schemaTypes.object,
          primitive: ast.schemaTypes.object,
          properties: [ast.factory.createProperty({ name: 'resource', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.url }) })],
        }),
      }),
    ],
  })

  test('a custom codec printer node prints the encode transform for request schemas and the decode transform for responses', async () => {
    const source = await renderOperation(getResource, { ...defaultOptions, inferred: 'codec', printer: { nodes: urlCodec } })
    expect(source).toContain(`export const getResourcePathResourceSchema = ${encodeUrl}`)
    expect(source).toContain(`resource: ${encodeUrl},`)
    expect(source).toContain(`resource: ${decodeUrl},`)
  })

  test("a custom codec printer node: 'codec' types the request side from z.input and the response from z.output, true keeps z.infer", async () => {
    const direction = await renderOperation(getResource, { ...defaultOptions, inferred: 'codec', printer: { nodes: urlCodec } })
    expect(direction).toContain('export type GetResourcePathSchemaType = z.input<typeof getResourcePathSchema>')
    expect(direction).toContain('export type GetResourceStatus200SchemaType = z.output<typeof getResourceStatus200Schema>')

    const infer = await renderOperation(getResource, { ...defaultOptions, inferred: true, printer: { nodes: urlCodec } })
    expect(infer).toContain('export type GetResourcePathSchemaType = z.infer<typeof getResourcePathSchema>')
    expect(infer).toContain('export type GetResourceStatus200SchemaType = z.infer<typeof getResourceStatus200Schema>')
    expect(infer).toContain(`resource: ${encodeUrl},`)
  })

  test('inferred: true keeps z.infer for a codec component and its encode variant', async () => {
    const source = await renderSchema(slotSchema, resolveOptions(true))
    expect(source).toContain('export type SlotSchemaType = z.infer<typeof slotSchema>')
    expect(source).toContain('export type SlotInputSchemaType = z.infer<typeof slotInputSchema>')
  })

  test("inferred: 'codec' reads the encode variant from its input and the component from its output", async () => {
    const source = await renderSchema(slotSchema, resolveOptions('codec'))
    expect(source).toContain('export type SlotSchemaType = z.output<typeof slotSchema>')
    expect(source).toContain('export type SlotInputSchemaType = z.input<typeof slotInputSchema>')
  })

  test('inferred: true keeps z.infer for every operation schema', async () => {
    const source = await renderOperation(bookSlot, resolveOptions(true))
    expect(source).not.toMatch(/z\.(input|output)</)
    expect(source).toContain('export type BookSlotOptionsSchemaType = z.infer<typeof bookSlotOptionsSchema>')
  })

  test("inferred: 'codec' reads request schemas from their input and response schemas from their output", async () => {
    const source = await renderOperation(bookSlot, resolveOptions('codec'))
    expect(source).toContain('export type BookSlotBodySchemaType = z.input<typeof bookSlotBodySchema>')
    expect(source).toContain('export type BookSlotPathSchemaType = z.input<typeof bookSlotPathSchema>')
    expect(source).toContain('export type BookSlotOptionsSchemaType = z.input<typeof bookSlotOptionsSchema>')
    expect(source).toContain('export type BookSlotStatus200SchemaType = z.output<typeof bookSlotStatus200Schema>')
    expect(source).toContain('export type BookSlotResponsesSchemaType = z.output<typeof bookSlotResponsesSchema>')
    expect(source).not.toContain('z.infer')
  })
})

describe('zodGenerator — Type Guards', () => {
  const testSchema = ast.factory.createSchema({
    type: ast.schemaTypes.object,
    primitive: ast.schemaTypes.object,
    name: 'Pet',
    properties: [
      ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.integer }) }),
      ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) }),
    ],
  })

  test('typeGuards: true generates both is* and assert*', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, typeGuards: true }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: 'typeguards-true' })

    await renderGeneratorSchema(zodGenerator, testSchema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })

    const source = rawSources(driver.fileManager.files)[0]
    expect(source).toBeDefined()
    expect(source).toContain('export const isPet = (data: unknown): data is z.infer<typeof petSchema> => petSchema.validate(data)')
    expect(source).toContain('export function assertPet(data: unknown): asserts data is z.infer<typeof petSchema>')
    expect(source).toContain('if (!petSchema.validate(data))')
    expect(source).toContain('petSchema.parse(data)')
  })

  test('typeGuards: { is: true, assert: false } generates only is*', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, typeGuards: { is: true, assert: false } }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: 'typeguards-is-only' })

    await renderGeneratorSchema(zodGenerator, testSchema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })

    const source = rawSources(driver.fileManager.files)[0]
    expect(source).toBeDefined()
    expect(source).toContain('export const isPet = (data: unknown): data is z.infer<typeof petSchema> => petSchema.validate(data)')
    expect(source).not.toContain('assertPet')
  })

  test('typeGuards: { is: false, assert: true } generates only assert*', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, typeGuards: { is: false, assert: true } }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: 'typeguards-assert-only' })

    await renderGeneratorSchema(zodGenerator, testSchema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })

    const source = rawSources(driver.fileManager.files)[0]
    expect(source).toBeDefined()
    expect(source).not.toContain('isPet')
    expect(source).toContain('export function assertPet(data: unknown): asserts data is z.infer<typeof petSchema>')
  })

  test('typeGuards with inferred: true narrows to inferred type alias', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, typeGuards: true, inferred: true }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: 'typeguards-inferred' })

    await renderGeneratorSchema(zodGenerator, testSchema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })

    const source = rawSources(driver.fileManager.files)[0]
    expect(source).toBeDefined()
    expect(source).toContain('export type PetSchemaType = z.infer<typeof petSchema>')
    expect(source).toContain('export const isPet = (data: unknown): data is PetSchemaType => petSchema.validate(data)')
    expect(source).toContain('export function assertPet(data: unknown): asserts data is PetSchemaType')
  })

  test('typeGuards with mini: true uses z.validate and z.parse', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, typeGuards: true, mini: true, importPath: 'zod/mini' }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: 'typeguards-mini' })

    await renderGeneratorSchema(zodGenerator, testSchema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })

    const source = rawSources(driver.fileManager.files)[0]
    expect(source).toBeDefined()
    expect(source).toContain('export const isPet = (data: unknown): data is z.infer<typeof petSchema> => z.validate(petSchema, data)')
    expect(source).toContain('export function assertPet(data: unknown): asserts data is z.infer<typeof petSchema>')
    expect(source).toContain('if (!z.validate(petSchema, data))')
    expect(source).toContain('z.parse(petSchema, data)')
  })
})

describe('zodGenerator — Compile Option', () => {
  test('compile option wraps schema in z.compile', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, compile: true }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: 'compileSchema' })

    await renderGeneratorSchema(zodGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })

    const source = rawSources(driver.fileManager.files).join('\n')
    expect(source).toContain('export const petSchema = z.compile(z.object(')
  })

  test('compile option in mini mode wraps schema in z.compile', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, compile: true, mini: true, importPath: 'zod/mini' }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: 'compileMiniSchema' })

    await renderGeneratorSchema(zodGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })

    const source = rawSources(driver.fileManager.files).join('\n')
    expect(source).toContain("import * as z from 'zod/mini'")
    expect(source).toContain('export const petSchema = z.compile(z.object(')
    expect(source).toContain('status: z.optional(z.string())')
    expect(source).toContain('tags: z.optional(z.array(z.string()))')
  })

  test('compile option on operation wraps schemas in z.compile but leaves bare ref', async () => {
    const operationWithRefAndInline: ast.OperationNode = ast.factory.createOperation({
      operationId: 'getPet',
      method: 'GET',
      path: '/pets/{petId}',
      tags: ['pets'],
      parameters: [
        ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: ast.schemaTypes.string }), required: true }),
      ],
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          schema: ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'Pet', ref: '#/components/schemas/Pet' }),
          description: 'A pet ref',
        }),
        ast.factory.createResponse({
          statusCode: '400',
          schema: ast.factory.createSchema({
            type: ast.schemaTypes.object,
            primitive: ast.schemaTypes.object,
            properties: [ast.factory.createProperty({ name: 'message', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) })],
          }),
          description: 'Error',
        }),
      ],
    })

    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, compile: true }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: 'compileOperation' })

    await renderGeneratorOperation(zodGenerator, operationWithRefAndInline, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })

    const source = rawSources(driver.fileManager.files).join('\n')
    // Parameter schema is wrapped
    expect(source).toContain('export const getPetPathPetIdSchema = z.compile(z.string())')
    // Bare ref response is NOT wrapped (since Pet schema is already compiled at declaration)
    expect(source).toContain('export const getPetStatus200Schema = petSchema')
    // Inline object response is wrapped
    expect(source).toContain('export const getPetStatus400Schema = z.compile(z.object(')
    // Response union (single ref member) is NOT wrapped
    expect(source).toContain('export const getPetResponseSchema = getPetStatus200Schema')
    // Error union (single ref member) is NOT wrapped
    expect(source).toContain('export const getPetErrorSchema = getPetStatus400Schema')
  })

  test('compile with { strict: true } wraps schema with { strict: true } option', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, compile: { strict: true } }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: 'compileStrictSchema' })

    await renderGeneratorSchema(zodGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
    })

    const source = rawSources(driver.fileManager.files).join('\n')
    expect(source).toContain('export const petSchema = z.compile(z.object(')
    expect(source).toContain('{ strict: true })')
  })

  test('compile with { strict: true } skips cyclic schemas', async () => {
    const cyclicNodeSchema: ast.SchemaNode = ast.factory.createSchema({
      type: ast.schemaTypes.object,
      name: 'TreeNode',
      primitive: ast.schemaTypes.object,
      properties: [
        ast.factory.createProperty({ name: 'value', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) }),
        ast.factory.createProperty({
          name: 'children',
          schema: ast.factory.createSchema({
            type: ast.schemaTypes.array,
            items: [ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'TreeNode', ref: '#/components/schemas/TreeNode' })],
          }),
        }),
      ],
    })

    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, compile: { strict: true } }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver })
    const driver = createMockedPluginDriver({ name: 'compileStrictCyclic' })

    await renderGeneratorSchema(zodGenerator, cyclicNodeSchema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options,
      resolver,
      meta: {
        circularNames: ['TreeNode'],
        enumNames: [],
      },
    })

    const source = rawSources(driver.fileManager.files).join('\n')
    // Cyclic schema must NOT be wrapped in z.compile, preventing runtime strict compilation failures
    expect(source).not.toContain('z.compile(')
    expect(source).toContain('export const treeNodeSchema')
  })
})

describe('custom imports', () => {
  const codecImport = ast.factory.createImport({ name: ['myCodec'], path: 'my-codec/zod' })
  const bigintSchema = ast.factory.createSchema({ type: ast.schemaTypes.bigint, name: 'Counter' })

  async function render(schema: ast.SchemaNode, options: Partial<PluginZod['resolvedOptions']>) {
    const resolved: PluginZod['resolvedOptions'] = { ...defaultOptions, ...options }
    const resolver = Resolver.merge(resolverZod)
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: resolved, resolver })
    const driver = createMockedPluginDriver({ name: 'customImports' })

    await renderGeneratorSchema(zodGenerator, schema, {
      config: testConfig,
      adapter: createMockedAdapter({ resolvedOptions: { dateType: 'string' } }),
      driver,
      plugin,
      options: resolved,
      resolver,
    })

    return driver.fileManager.files
  }

  test('`this.import` in a printer.nodes handler adds the import to the file', async () => {
    const files = await render(bigintSchema, {
      printer: {
        nodes: {
          bigint() {
            this.import(codecImport)
            return 'myCodec.uint64()'
          },
        },
      },
    })

    expect(files[0]?.imports.map((imp) => imp.path)).toContain('my-codec/zod')
  })

  test('files whose schema does not reach the handler get no import', async () => {
    const files = await render(ast.factory.createSchema({ type: ast.schemaTypes.string, name: 'PetName' }), {
      printer: {
        nodes: {
          bigint() {
            this.import(codecImport)
            return 'myCodec.uint64()'
          },
        },
      },
    })

    expect(files[0]?.imports.map((imp) => imp.path)).not.toContain('my-codec/zod')
  })
})
