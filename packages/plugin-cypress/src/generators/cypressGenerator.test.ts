/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Config } from '@kubb/core'
import { ast, memoryStorage } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from '@kubb/core/mocks'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverCypress } from '../resolvers/resolverCypress.ts'
import type { PluginCypress } from '../types.ts'
import { cypressGenerator } from './cypressGenerator.tsx'

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

const defaultOptions: PluginCypress['resolvedOptions'] = {
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
  baseURL: undefined,
  group: null,
  dataReturnType: 'data',
  resolver: resolverCypress,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

describe('cypressGenerator — Operation', () => {
  const operations = [
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
            schema: ast.factory.createSchema({ type: 'object', properties: [] }),
            description: 'Expected response',
          }),
        ],
      }),
    },
    {
      name: 'getPets',
      node: ast.factory.createOperation({
        operationId: 'getPets',
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
        ],
      }),
    },
    {
      name: 'createPet',
      node: ast.factory.createOperation({
        operationId: 'createPets',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        requestBody: {
          description: 'Pet to add',
          content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
        },
        responses: [
          ast.factory.createResponse({ statusCode: '201', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Null response' }),
        ],
      }),
    },
    {
      name: 'updatePet',
      node: ast.factory.createOperation({
        operationId: 'updatePet',
        method: 'PUT',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
        requestBody: {
          content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
        },
        responses: [
          ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Updated pet' }),
        ],
      }),
    },
    {
      name: 'deletePet',
      node: ast.factory.createOperation({
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
        responses: [ast.factory.createResponse({ statusCode: '204', description: 'No content', schema: ast.factory.createSchema({ type: 'void' }) })],
      }),
    },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode }>

  test.each(operations)('$name', async (props) => {
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options: defaultOptions, resolver: resolverCypress })
    const driver = createMockedPluginDriver({
      name: props.name,
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(cypressGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverCypress,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})

describe('cypressGenerator — dataReturnType', () => {
  const node = ast.factory.createOperation({
    operationId: 'getPets',
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
    ],
  })

  test('data — returns res.body', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, dataReturnType: 'data' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({
      name: 'dataReturnType data',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'dataReturnType data')
  })

  test('full — returns entire Chainable', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, dataReturnType: 'full' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({
      name: 'dataReturnType full',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'dataReturnType full')
  })
})

describe('cypressGenerator — params casing', () => {
  const node = ast.factory.createOperation({
    operationId: 'getPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    parameters: [ast.factory.createParameter({ name: 'page_size', in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) })],
    responses: [
      ast.factory.createResponse({
        statusCode: '200',
        schema: ast.factory.createSchema({ type: 'object', properties: [] }),
        description: 'A paged array of pets',
      }),
    ],
  })

  test('query param name is always camelCased', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({
      name: 'paramsCasing camelcase',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'paramsCasing camelcase')
  })
})

describe('cypressGenerator — params casing headers', () => {
  const nodeWithHeaders = ast.factory.createOperation({
    operationId: 'getPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    parameters: [
      ast.factory.createParameter({ name: 'page_size', in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) }),
      ast.factory.createParameter({ name: 'x-api-key', in: 'header', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
    ],
    responses: [
      ast.factory.createResponse({
        statusCode: '200',
        schema: ast.factory.createSchema({ type: 'object', properties: [] }),
        description: 'A paged array of pets',
      }),
    ],
  })

  test('header and query param names are always camelCased and remapped', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({
      name: 'paramsCasing camelcase headers',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(cypressGenerator, nodeWithHeaders, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'paramsCasing camelcase headers')
  })
})

describe('cypressGenerator — baseURL', () => {
  const node = ast.factory.createOperation({
    operationId: 'getPets',
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
    ],
  })

  test('static string — prepended to url', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, baseURL: 'https://api.example.com' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({
      name: 'baseURL static',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'baseURL static')
  })

  test('template string — emitted as template literal', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, baseURL: '${123456}' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({
      name: 'baseURL template',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'baseURL template')
  })
})

describe('cypressGenerator — transformers', () => {
  test('schema visitor — filters to required properties only', async () => {
    const macro: ast.Macro = {
      name: 'required-properties-only',
      schema(node) {
        if ('properties' in node) {
          return { ...node, properties: node.properties.filter((p) => p.required) }
        }
        return undefined
      },
    }

    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options: defaultOptions, resolver: resolverCypress, macros: [macro] })
    const driver = createMockedPluginDriver({
      name: 'transformers schema visitor',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    const node = ast.factory.createOperation({
      operationId: 'createPets',
      method: 'POST',
      path: '/pets',
      tags: ['pets'],
      requestBody: {
        content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
      },
      responses: [
        ast.factory.createResponse({ statusCode: '201', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Null response' }),
      ],
    })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'transformers schema visitor')
  })
})
