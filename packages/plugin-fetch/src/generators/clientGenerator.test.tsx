import { resolverClient } from '@internals/client'
import type { Config } from '@kubb/core'
import { ast, memoryStorage } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from '@kubb/core/mocks'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import type { PluginFetch } from '../types.ts'
import { clientGenerator } from './clientGenerator.tsx'

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

const defaultOptions: PluginFetch['resolvedOptions'] = {
  output: { path: '.', banner: '/* eslint-disable no-alert, no-console */' },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  baseURL: undefined,
  parser: false,
  sdk: undefined,
  resolver: resolverClient,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const findPetsByTagsNode = ast.factory.createOperation({
  operationId: 'findPetsByTags',
  method: 'GET',
  path: '/pet/findByTags',
  tags: ['pet'],
  parameters: [
    ast.factory.createParameter({
      name: 'tags',
      in: 'query',
      schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] }),
      required: true,
    }),
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const getPetByIdNode = ast.factory.createOperation({
  operationId: 'getPetById',
  method: 'GET',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'integer' }), required: true })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const deletePetNode = ast.factory.createOperation({
  operationId: 'deletePet',
  method: 'DELETE',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'integer' }), required: true })],
  responses: [ast.factory.createResponse({ statusCode: '204', schema: ast.factory.createSchema({ type: 'void' }), description: 'no content' })],
})

const createPetNode = ast.factory.createOperation({
  operationId: 'addPet',
  method: 'POST',
  path: '/pet',
  tags: ['pet'],
  requestBody: {
    required: true,
    content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
  },
  responses: [
    ast.factory.createResponse({ statusCode: '201', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Pet created' }),
    ast.factory.createResponse({ statusCode: '405', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
  ],
})

describe('clientGenerator operation', () => {
  const testData = [
    { name: 'findPetsByTags', node: findPetsByTagsNode, options: {} },
    { name: 'getPetById', node: getPetByIdNode, options: {} },
    { name: 'deletePetNoContent', node: deletePetNode, options: {} },
    { name: 'addPetMultiStatus', node: createPetNode, options: {} },
    { name: 'addPetMultiStatusWithZod', node: createPetNode, options: { parser: 'zod' as const } },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginFetch['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginFetch['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const plugin = createMockedPlugin<PluginFetch>({ name: 'plugin-fetch', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({
      name: props.name,
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(clientGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverClient,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})
