import { ast, Resolver } from '@kubb/kit'
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
import { valibotGenerator } from './valibotGenerator.tsx'

const { createContent, createSchema, createProperty, createOperation, createParameter, createResponse } = ast.factory

const defaultOptions: PluginValibot['resolvedOptions'] = {
  inferred: false,
  importPath: 'valibot',
  regexType: 'literal',
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

    await renderGeneratorSchema(valibotGenerator, node, { ...context, driver })

    await matchFiles(driver.fileManager.files, name)
  })

  test('a circular schema is annotated, so its v.lazy self-reference compiles', async () => {
    const { driver, context } = setup('circular', { inferred: true })
    driver.inputNode = ast.factory.createInput({ schemas: [petSchema] })

    await renderGeneratorSchema(valibotGenerator, petSchema, { ...context, driver })

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

  test.each(operations)('$name', async ({ name, node, options }) => {
    const { driver, context } = setup(name, options)

    await renderGeneratorOperation(valibotGenerator, node, { ...context, driver })

    await matchFiles(driver.fileManager.files, name)
  })
})
