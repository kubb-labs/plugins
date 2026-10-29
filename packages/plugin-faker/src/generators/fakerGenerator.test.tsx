import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { promisify } from 'node:util'
import { ast } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation, renderGeneratorSchema } from 'kubb/kit/testing'
import { parserTs } from '@kubb/parser-ts'
import { type PluginTs, resolverTs, typeGenerator } from '@kubb/plugin-ts'
import { describe, expect, onTestFinished, test } from 'vitest'
import { format, matchFiles, testConfig } from '#mocks'
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

// Issue #928: a nullable scalar inlines its primitive, so the factory has to keep the
// nullability the type plugin emitted — otherwise an msw handler with `parser: 'faker'`
// hands it a `T | null` it cannot accept.
const nullableNameSchema = ast.factory.createSchema({
  type: 'string',
  name: 'NullableName',
  nullable: true,
})

const primitiveAllOfSchema = ast.factory.createSchema({
  type: ast.schemaTypes.intersection,
  name: 'Both',
  members: [
    ast.factory.createSchema({ type: ast.schemaTypes.ref, ref: '#/components/schemas/Id', schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) }),
    ast.factory.createSchema({
      type: ast.schemaTypes.ref,
      ref: '#/components/schemas/Code',
      schema: ast.factory.createSchema({ type: ast.schemaTypes.string, max: 8 }),
    }),
  ],
})

const primitiveEnumAllOfSchema = ast.factory.createSchema({
  type: ast.schemaTypes.intersection,
  name: 'Choice',
  members: [
    ast.factory.createSchema({ type: ast.schemaTypes.string }),
    ast.factory.createSchema({
      type: ast.schemaTypes.union,
      members: ['a', 'b'].map((value) => ast.factory.createSchema({ type: ast.schemaTypes.enum, primitive: 'string', enumValues: [value] })),
    }),
  ],
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

// Issue #873: a named union schema referenced by a response. The status factory
// declares `Partial<T>` and forwards it, so the union factory has to accept a
// partial and merge it into the picked member.
const apiErrorSchema = ast.factory.createSchema({
  type: 'union',
  name: 'ApiError',
  members: [
    ast.factory.createSchema({
      type: 'object',
      properties: [
        ast.factory.createProperty({
          name: 'error',
          required: true,
          schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['not_found'] }),
        }),
      ],
    }),
    ast.factory.createSchema({
      type: 'object',
      properties: [
        ast.factory.createProperty({
          name: 'error',
          required: true,
          schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['rate_limited'] }),
        }),
      ],
    }),
  ],
})

// Same mismatch as ApiError, but for a named array: `Partial<string[]>` is
// `(string | undefined)[]`, which a factory taking the full array type rejects.
const petListSchema = ast.factory.createSchema({
  type: 'array',
  name: 'PetList',
  items: [ast.factory.createSchema({ type: 'string' })],
})

// A named tuple: `Partial<[string, number]>` is `[string?, number?]`, so a shorter or
// `undefined`-holding override must not pass for the full tuple type either.
const coordinateSchema = ast.factory.createSchema({
  type: 'tuple',
  name: 'Coordinate',
  items: [ast.factory.createSchema({ type: 'number' }), ast.factory.createSchema({ type: 'number' })],
})

// Branches that differ in more than the discriminant: overriding only `error` must not leave
// the wrong branch's `details` shape behind (e.g. `retry_after_seconds` next to `field_errors`).
const apiErrorDetailedSchema = ast.factory.createSchema({
  type: 'union',
  name: 'ApiErrorDetailed',
  members: [
    ast.factory.createSchema({
      type: 'object',
      properties: [
        ast.factory.createProperty({
          name: 'error',
          required: true,
          schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['validation_failed'] }),
        }),
        ast.factory.createProperty({
          name: 'details',
          required: true,
          schema: ast.factory.createSchema({
            type: 'object',
            properties: [ast.factory.createProperty({ name: 'field_errors', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
          }),
        }),
      ],
    }),
    ast.factory.createSchema({
      type: 'object',
      properties: [
        ast.factory.createProperty({
          name: 'error',
          required: true,
          schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['rate_limited'] }),
        }),
        ast.factory.createProperty({
          name: 'details',
          required: true,
          schema: ast.factory.createSchema({
            type: 'object',
            properties: [ast.factory.createProperty({ name: 'retry_after_seconds', required: true, schema: ast.factory.createSchema({ type: 'integer' }) })],
          }),
        }),
      ],
    }),
  ],
})

// A union with an array member alongside an object member: an override targeting the array
// member must never be spread into the object member's fields (or vice versa).
const petOrPetListSchema = ast.factory.createSchema({
  type: 'union',
  name: 'PetOrPetList',
  members: [
    ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }),
    ast.factory.createSchema({ type: 'ref', name: 'PetList', ref: '#/components/schemas/PetList' }),
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

const defaultOptions: PluginFaker['resolvedOptions'] = {
  output: { path: '.', mode: 'directory' },
  exclude: [],
  include: undefined,
  override: [],
  typeMode: 'inferred',
  group: null,
  dateParser: 'faker',
  regexGenerator: 'faker',
  seed: undefined,
  locale: undefined,
  printer: undefined,
}

const defaultTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: 'types', mode: 'directory' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

describe('fakerGenerator — schema', () => {
  test.each([2, 5])('typechecks factories in a %i-schema allOf cycle', async (size) => {
    const names = ['Base', 'Child', 'Branch', 'Leaf', 'Root'].slice(0, size)
    const schemas: Array<ast.SchemaNode> = names.map((name, index) =>
      ast.factory.createSchema({
        type: 'intersection',
        name,
        members: [
          ast.factory.createSchema({ type: 'ref', name: names[(index + 1) % size]!, ref: `#/components/schemas/${names[(index + 1) % size]}` }),
          ast.factory.createSchema({
            type: 'object',
            properties: [ast.factory.createProperty({ name: 'extra', schema: ast.factory.createSchema({ type: 'string' }) })],
          }),
        ],
      }),
    )
    schemas[0] = ast.factory.createSchema({
      type: 'object',
      name: 'Base',
      properties: [
        ast.factory.createProperty({ name: 'parent', schema: ast.factory.createSchema({ type: 'ref', name: 'Child', ref: '#/components/schemas/Child' }) }),
      ],
    })
    const tsOptions: PluginTs['resolvedOptions'] = {
      output: { path: 'types', mode: 'directory' },
      enum: { type: 'asConst', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' },
      optionalType: 'questionToken',
      arrayType: 'array',
      syntaxType: 'type',
      operations: 'export',
      exclude: [],
      include: undefined,
      override: [],
      group: null,
      printer: undefined,
    }
    const tsPlugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: tsOptions, resolver: resolverTs })
    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options: defaultOptions, resolver: resolverFaker })
    const driver = createMockedPluginDriver({ name: 'allOfCycle', plugin: tsPlugin })
    driver.inputNode = ast.factory.createInput({ schemas })
    for (const node of schemas) {
      await renderGeneratorSchema(typeGenerator, node, {
        config: testConfig,
        adapter: createMockedAdapter(),
        driver,
        plugin: tsPlugin,
        options: tsOptions,
        resolver: resolverTs,
      })
      await renderGeneratorSchema(fakerGenerator, node, {
        config: testConfig,
        adapter: createMockedAdapter(),
        driver,
        plugin,
        options: defaultOptions,
        resolver: resolverFaker,
      })
    }

    const dir = await fs.mkdtemp(path.join(import.meta.dirname, '.faker-'))
    onTestFinished(() => fs.rm(dir, { recursive: true, force: true }))
    for (const file of driver.fileManager.files) {
      const filePath = path.join(dir, path.relative(path.resolve(testConfig.output.path), file.path))
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, parserTs().parse(file))
    }
    const checkPath = path.join(dir, 'check.ts')
    await fs.writeFile(
      checkPath,
      `import { createChild } from './createChild'
const child = createChild({ extra: 'fixed' as const, custom: true as const })
const extra: 'fixed' = child.extra
const custom: true = child.custom`,
    )
    const compiler = path.join(path.dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin/tsc')
    await expect(
      promisify(execFile)(process.execPath, [
        compiler,
        '--ignoreConfig',
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        '--module',
        'preserve',
        '--moduleResolution',
        'bundler',
        '--target',
        'es2022',
        checkPath,
      ]),
    ).resolves.toMatchObject({ stdout: '', stderr: '' })
  })

  test.each([
    { name: 'pet', node: petSchema, options: {} },
    { name: 'treeNode', node: treeNodeSchema, options: {} },
    { name: 'apiError', node: apiErrorSchema, options: {} },
    { name: 'apiErrorDetailed', node: apiErrorDetailedSchema, options: {} },
    { name: 'petList', node: petListSchema, options: {} },
    { name: 'petOrPetList', node: petOrPetListSchema, options: {} },
    { name: 'coordinate', node: coordinateSchema, options: {} },
    { name: 'catCycle', node: catSchema, options: {} },
    { name: 'nullableName', node: nullableNameSchema, options: {} },
    { name: 'primitiveAllOf', node: primitiveAllOfSchema, options: {} },
    { name: 'primitiveAllOfSchema', node: primitiveAllOfSchema, options: { typeMode: 'schema' } },
    { name: 'primitiveEnumAllOf', node: primitiveEnumAllOfSchema, options: {} },
  ] as const)('$name', async ({ name, node, options }) => {
    const resolvedOptions: PluginFaker['resolvedOptions'] = { ...defaultOptions, ...options }
    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options: resolvedOptions, resolver: resolverFaker })
    const driver = createMockedPluginDriver({
      name,
      plugin: defaultTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    driver.inputNode = ast.factory.createInput({
      schemas: [
        categorySchema,
        apiErrorSchema,
        apiErrorDetailedSchema,
        petListSchema,
        petOrPetListSchema,
        coordinateSchema,
        emojiSchema,
        errorSchema,
        petSchema,
        treeNodeSchema,
        petPolySchema,
        catSchema,
        dogSchema,
      ],
    })

    await renderGeneratorSchema(fakerGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
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

    const output = await format(parserTs().parse(file!))

    expect(output).toContain('export function createEmoji(data?: string): string')
    expect(output).not.toContain('import type { Emoji }')
  })

  test.each([
    { typeMode: 'inferred' as const, signature: 'export function createPet<TData extends Partial<Pet> = object>(data?: TData) {' },
    { typeMode: 'schema' as const, signature: 'export function createPet(data?: Partial<Pet>): Pet {' },
  ])('object factory keeps its opening brace on the signature line before formatting ($typeMode)', async ({ typeMode, signature }) => {
    const resolvedOptions: PluginFaker['resolvedOptions'] = { ...defaultOptions, typeMode }
    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options: resolvedOptions, resolver: resolverFaker })
    const driver = createMockedPluginDriver({
      name: 'pet',
      plugin: defaultTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorSchema(
      fakerGenerator,
      { ...petSchema, description: 'A pet' },
      {
        config: testConfig,
        adapter: createMockedAdapter(),
        driver,
        plugin,
        options: resolvedOptions,
        resolver: resolverFaker,
      },
    )

    const file = driver.fileManager.files.find((item) => item.baseName === 'createPet.ts')
    const output = await parserTs().parse(file!)

    expect(output).toContain(`/**\n * @description A pet\n */\n${signature}`)
    expect(output).not.toMatch(/^\s+export function/m)
  })
})

describe('fakerGenerator — operation', () => {
  test.each(['inferred', 'schema'] as const)('typechecks binary refs and omitted properties in %s mode', async (typeMode) => {
    const pdf = ast.factory.createSchema({ type: 'blob', name: 'Pdf' })
    const payload = ast.factory.createSchema({
      type: 'object',
      name: 'Payload',
      properties: [
        ast.factory.createProperty({ name: 'id', schema: ast.factory.createSchema({ type: 'string', readOnly: true }) }),
        ast.factory.createProperty({ name: 'secret', schema: ast.factory.createSchema({ type: 'string', writeOnly: true }) }),
        ast.factory.createProperty({ name: 'name', schema: ast.factory.createSchema({ type: 'string' }) }),
      ],
    })
    const operations = [
      ...['*/*', 'application/octet-stream'].map((contentType, index) =>
        ast.factory.createOperation({
          operationId: `download${index}`,
          method: 'GET',
          path: `/download${index}`,
          responses: [
            ast.factory.createResponse({
              statusCode: '200',
              content: [
                ast.factory.createContent({
                  contentType,
                  schema: ast.factory.createSchema({ type: 'ref', name: 'Pdf', ref: '#/components/schemas/Pdf', schema: pdf }),
                }),
              ],
            }),
          ],
        }),
      ),
      ast.factory.createOperation({
        operationId: 'updateA',
        method: 'PUT',
        path: '/a',
        requestBody: {
          content: ['application/json', 'application/xml'].map((contentType, index) =>
            ast.factory.createContent({
              contentType,
              schema: index === 0 ? payload : ast.factory.createSchema({ type: 'ref', name: 'Payload', ref: '#/components/schemas/Payload', schema: payload }),
              keysToOmit: ['id'],
            }),
          ),
        },
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            content: [ast.factory.createContent({ contentType: 'application/json', schema: payload, keysToOmit: ['secret'] })],
          }),
        ],
      }),
    ]
    const tsOptions = {
      ...defaultTsPlugin.options,
      enum: { type: 'asConst', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' },
      optionalType: 'questionToken',
      arrayType: 'array',
      syntaxType: 'type',
      operations: 'export',
    } as PluginTs['resolvedOptions']
    const tsPlugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: tsOptions, resolver: resolverTs })
    const options = { ...defaultOptions, typeMode }
    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options, resolver: resolverFaker })
    const driver = createMockedPluginDriver({ name: 'binaryReadonly', plugin: tsPlugin })
    for (const node of [pdf, payload]) {
      await renderGeneratorSchema(typeGenerator, node, {
        config: testConfig,
        adapter: createMockedAdapter(),
        driver,
        plugin: tsPlugin,
        options: tsOptions,
        resolver: resolverTs,
      })
      await renderGeneratorSchema(fakerGenerator, node, {
        config: testConfig,
        adapter: createMockedAdapter(),
        driver,
        plugin,
        options,
        resolver: resolverFaker,
      })
    }
    for (const node of operations) {
      await renderGeneratorOperation(typeGenerator, node, {
        config: testConfig,
        adapter: createMockedAdapter(),
        driver,
        plugin: tsPlugin,
        options: tsOptions,
        resolver: resolverTs,
      })
      await renderGeneratorOperation(fakerGenerator, node, {
        config: testConfig,
        adapter: createMockedAdapter(),
        driver,
        plugin,
        options,
        resolver: resolverFaker,
      })
    }
    const dir = await fs.mkdtemp(path.join(import.meta.dirname, '.faker-'))
    onTestFinished(() => fs.rm(dir, { recursive: true, force: true }))
    const paths: Array<string> = []
    for (const file of driver.fileManager.files) {
      const filePath = path.join(dir, path.relative(path.resolve(testConfig.output.path), file.path))
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      const output = parserTs().parse(file)
      if (file.baseName.startsWith('createDownload')) {
        expect(output).not.toContain('Partial<')
        expect(output).toContain('return createPdf(data)\n')
      }
      if (file.baseName === 'createUpdateA.ts') {
        const body = output.slice(output.indexOf('export function createUpdateABody'))
        expect(body).not.toMatch(/\bid: faker/)
        expect(body).toContain('const { id: _omit0, ...defaultFakeData } = createPayload()')
        const response = output.slice(0, output.indexOf('export function createUpdateABody'))
        expect(response).not.toMatch(/\bsecret:/)
        expect(body).toMatch(/\bname:/)
        expect(response).toMatch(/\bid:/)
      }
      await fs.writeFile(filePath, output)
      paths.push(filePath)
    }
    const checkPath = path.join(dir, 'check.ts')
    await fs.writeFile(
      checkPath,
      `import { createUpdateABodyXml } from './createUpdateA'
const body = createUpdateABodyXml({ name: 'fixed' as const })
${typeMode === 'inferred' ? "const name: 'fixed' = body.name" : ''}
// @ts-expect-error Read-only properties are absent from request bodies.
body.id
`,
    )
    paths.push(checkPath)
    const compiler = path.join(path.dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin/tsc')
    await expect(
      promisify(execFile)(process.execPath, [
        compiler,
        '--ignoreConfig',
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        '--module',
        'preserve',
        '--moduleResolution',
        'bundler',
        '--target',
        'es2022',
        ...paths,
      ]),
    ).resolves.toMatchObject({ stdout: '', stderr: '' })
  })

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
    {
      name: 'getPet',
      node: ast.factory.createOperation({
        operationId: 'getPet',
        method: 'GET',
        path: '/pet',
        tags: ['pets'],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            description: 'A pet',
            schema: ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }),
          }),
          ast.factory.createResponse({
            statusCode: '202',
            description: 'A list of pets',
            schema: ast.factory.createSchema({ type: 'ref', name: 'PetList', ref: '#/components/schemas/PetList' }),
          }),
          ast.factory.createResponse({
            statusCode: '404',
            description: 'Not found',
            schema: ast.factory.createSchema({ type: 'ref', name: 'ApiError', ref: '#/components/schemas/ApiError' }),
          }),
        ],
      }),
      options: {},
    },
    {
      name: 'inlineResponseUnion',
      node: ast.factory.createOperation({
        operationId: 'getPet',
        method: 'GET',
        path: '/pet',
        tags: ['pets'],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            description: 'A pet',
            schema: ast.factory.createSchema({
              type: 'object',
              properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
            }),
          }),
          ast.factory.createResponse({
            statusCode: '401',
            description: 'Unauthorized',
            schema: ast.factory.createSchema({
              type: 'object',
              properties: [
                ast.factory.createProperty({
                  name: 'error',
                  required: true,
                  schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['unauthorized'] }),
                }),
              ],
            }),
          }),
        ],
      }),
      options: {},
    },
    {
      name: 'inlineResponseMultiContent',
      node: ast.factory.createOperation({
        operationId: 'getPet',
        method: 'GET',
        path: '/pet',
        tags: ['pets'],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            description: 'A pet',
            content: [
              ast.factory.createContent({
                contentType: 'application/json',
                schema: ast.factory.createSchema({
                  type: 'object',
                  properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
                }),
              }),
              ast.factory.createContent({
                contentType: 'application/xml',
                schema: ast.factory.createSchema({
                  type: 'object',
                  properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
                }),
              }),
            ],
          }),
          ast.factory.createResponse({
            statusCode: '401',
            description: 'Unauthorized',
            schema: ast.factory.createSchema({
              type: 'object',
              properties: [ast.factory.createProperty({ name: 'error', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
            }),
          }),
        ],
      }),
      options: {},
    },
    {
      name: 'responseNameCollision',
      node: ast.factory.createOperation({
        operationId: 'getThing',
        method: 'GET',
        path: '/things/{id}',
        tags: ['things'],
        parameters: [ast.factory.createParameter({ name: 'id', in: 'path', schema: ast.factory.createSchema({ type: 'integer' }), required: true })],
        responses: [
          ast.factory.createResponse({
            statusCode: '200',
            description: 'The requested thing',
            schema: ast.factory.createSchema({
              type: 'ref',
              name: 'GetThingResponse',
              ref: '#/components/schemas/GetThingResponse',
            }),
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

    driver.inputNode = ast.factory.createInput({ schemas: [apiErrorSchema, petListSchema, categorySchema, errorSchema, petSchema, treeNodeSchema] })

    await renderGeneratorOperation(fakerGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: resolvedOptions,
      resolver: resolverFaker,
    })

    await matchFiles(driver.fileManager.files, name)
  })

  test('bodyless response omits unused status type import', async () => {
    const resolvedOptions: PluginFaker['resolvedOptions'] = { ...defaultOptions }
    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options: resolvedOptions, resolver: resolverFaker })
    const driver = createMockedPluginDriver({
      name: 'archiveBook',
      plugin: defaultTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })
    const node = ast.factory.createOperation({
      operationId: 'archiveBook',
      method: 'POST',
      path: '/books/{bookId}/archive',
      tags: ['books'],
      responses: [
        ast.factory.createResponse({ statusCode: '204', description: 'Archived', schema: ast.factory.createSchema({ type: 'void' }) }),
        ast.factory.createResponse({
          statusCode: '404',
          description: 'Not found',
          schema: ast.factory.createSchema({ type: 'ref', name: 'ApiError', ref: '#/components/schemas/ApiError' }),
        }),
      ],
    })

    await renderGeneratorOperation(fakerGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: resolvedOptions,
      resolver: resolverFaker,
    })

    const file = driver.fileManager.files.find((item) => item.baseName === 'createArchiveBook.ts')
    expect(file).toBeDefined()

    const output = await format(parserTs().parse(file!))

    expect(output).toContain('export function createArchiveBookStatus204() {')
    const typeImport = output.split('\n').find((line) => line.startsWith('import type'))
    expect(typeImport).toContain('ArchiveBookStatus404')
    expect(typeImport).not.toMatch(/\bArchiveBookStatus204\b/)
  })
})

describe('fakerGenerator — custom imports', () => {
  test('`this.import` in a printer.nodes handler adds the import to the file', async () => {
    const options: PluginFaker['resolvedOptions'] = {
      ...defaultOptions,
      printer: {
        nodes: {
          bigint() {
            this.import(ast.factory.createImport({ name: ['fakeInt64'], path: 'my-int64/faker' }))
            return 'fakeInt64()'
          },
        },
      },
    }
    const plugin = createMockedPlugin<PluginFaker>({ name: 'plugin-faker', options, resolver: resolverFaker })
    const driver = createMockedPluginDriver({
      name: 'customImports',
      plugin: defaultTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorSchema(fakerGenerator, ast.factory.createSchema({ type: ast.schemaTypes.bigint, name: 'Counter' }), {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverFaker,
    })

    expect(driver.fileManager.files.flatMap((file) => file.imports.map((imp) => imp.path))).toContain('my-int64/faker')
  })
})
