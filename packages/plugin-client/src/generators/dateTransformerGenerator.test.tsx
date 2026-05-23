import type { Config } from '@kubb/core'
import { ast, memoryStorage } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation, renderGeneratorSchema } from '@kubb/core/mocks'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverClient } from '../resolvers/resolverClient.ts'
import type { PluginClient } from '../types.ts'
import { dateTransformerGenerator } from './dateTransformerGenerator.tsx'

const adapter = createMockedAdapter({ resolvedOptions: { dateType: 'date' } as never })

const testConfig: Config = {
  root: '.',
  input: { path: '' },
  output: { path: 'test' },
  plugins: [],
  parsers: [],
  adapter,
  storage: memoryStorage(),
}

const options: PluginClient['resolvedOptions'] = {
  dataReturnType: 'data',
  paramsCasing: undefined,
  paramsType: 'inline',
  pathParamsType: 'inline',
  client: 'axios',
  clientType: 'function',
  importPath: undefined,
  bundle: false,
  parser: 'client',
  coerceDates: true,
  output: { path: '.', banner: '/* eslint-disable no-alert, no-console */' },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  urlType: 'export',
  sdk: undefined,
  baseURL: undefined,
  resolver: resolverClient,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const dateLeaf = ast.createSchema({ type: 'date', representation: 'date', format: 'date-time' })

const petSchema = ast.createSchema({
  type: 'object',
  name: 'Pet',
  properties: [
    ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'string' }) }),
    ast.createProperty({ name: 'createdAt', required: false, schema: dateLeaf }),
    ast.createProperty({
      name: 'category',
      required: false,
      schema: ast.createSchema({
        type: 'ref',
        name: 'Category',
        schema: ast.createSchema({
          type: 'object',
          name: 'Category',
          properties: [ast.createProperty({ name: 'updatedAt', required: false, schema: dateLeaf })],
        }),
      }),
    }),
    ast.createProperty({ name: 'visits', required: false, schema: ast.createSchema({ type: 'array', items: [dateLeaf] }) }),
  ],
})

const inlineResponseOperation = ast.createOperation({
  operationId: 'getPet',
  method: 'GET',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
  requestBody: {
    content: [
      {
        contentType: 'application/json',
        schema: ast.createSchema({
          type: 'object',
          properties: [
            ast.createProperty({ name: 'bornAt', required: false, schema: ast.createSchema({ type: 'date', representation: 'date', format: 'date' }) }),
          ],
        }),
      },
    ],
  },
  responses: [
    ast.createResponse({
      statusCode: '200',
      schema: ast.createSchema({
        type: 'object',
        properties: [ast.createProperty({ name: 'createdAt', required: false, schema: dateLeaf })],
      }),
      description: 'successful operation',
    }),
  ],
})

function createDriver(name: string) {
  return createMockedPluginDriver({
    name,
    plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
  })
}

describe('dateTransformerGenerator schema', () => {
  test('Pet', async () => {
    const plugin = createMockedPlugin<PluginClient>({ name: 'plugin-client', options, resolver: resolverClient })
    const driver = createDriver('Pet')

    await renderGeneratorSchema(dateTransformerGenerator, petSchema, {
      config: testConfig,
      adapter,
      driver,
      plugin,
      options,
      resolver: resolverClient,
    })

    await matchFiles(driver.fileManager.files, 'transformerPet')
  })
})

describe('dateTransformerGenerator operation', () => {
  test('inlineResponseAndRequest', async () => {
    const plugin = createMockedPlugin<PluginClient>({ name: 'plugin-client', options, resolver: resolverClient })
    const driver = createDriver('getPet')

    await renderGeneratorOperation(dateTransformerGenerator, inlineResponseOperation, {
      config: testConfig,
      adapter,
      driver,
      plugin,
      options,
      resolver: resolverClient,
    })

    await matchFiles(driver.fileManager.files, 'transformerGetPet')
  })
})
