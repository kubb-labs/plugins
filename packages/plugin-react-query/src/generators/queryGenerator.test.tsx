/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import { ast } from '@kubb/kit'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { resolverClient } from '@internals/client'
import type { ResolvedOptions as ClientResolvedOptions } from '@internals/client'
import { describe, expect, test, vi } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMultiPluginDriver, matchFiles, renderGeneratorOperation, testConfig } from '#mocks'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import type { Transformer } from '@internals/tanstack-query'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { queryGenerator } from './queryGenerator.tsx'

const defaultOptions: PluginReactQuery['resolvedOptions'] = {
  client: { kind: 'contract', pluginName: 'plugin-axios' },
  queryKey: queryKeyTransformer,
  mutationKey: mutationKeyTransformer,
  query: {
    importPath: '@tanstack/react-query',
    methods: ['GET'],
  },
  mutation: {
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    importPath: '@tanstack/react-query',
  },
  suspense: false,
  infinite: false,
  customOptions: null,
  hooks: true,
  exclude: [],
  include: undefined,
  override: [],
  output: { path: '.', mode: 'directory' },
  group: null,
  resolver: resolverReactQuery,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.', mode: 'directory' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const mockedAxiosPlugin = createMockedPlugin({
  name: 'plugin-axios',
  options: { output: { path: './clients', mode: 'directory' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverClient,
})

const mockedClientPlugin = createMockedPlugin({
  name: 'plugin-client',
  options: {
    output: { path: './clients', mode: 'directory' },
    group: null,
    importPath: '../../client',
    returnType: 'plain',
  } as ClientResolvedOptions & { importPath: string },
  resolver: resolverClient,
})

const plugins = { 'plugin-ts': mockedTsPlugin, 'plugin-axios': mockedAxiosPlugin, 'plugin-client': mockedClientPlugin }

// Shared operation nodes
const findByTagsNode = ast.factory.createOperation({
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
    ast.factory.createParameter({ name: 'status', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) }),
    ast.factory.createParameter({ name: 'pageSize', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) }),
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
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
    ast.factory.createResponse({ statusCode: '400', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Invalid ID supplied' }),
  ],
})

const findByStatusNode = ast.factory.createOperation({
  operationId: 'findPetsByStatus',
  method: 'GET',
  path: '/pet/findByStatus',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'status', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const createUsersWithListInputNode = ast.factory.createOperation({
  operationId: 'createUsersWithListInput',
  method: 'POST',
  path: '/user/createWithList',
  tags: ['user'],
  requestBody: {
    content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
  },
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

// Headers do not identify a cache entry, so the key factory takes no parameter here and the hook
// must not pass one.
const headersOnlyNode = ast.factory.createOperation({
  operationId: 'retrieveMyProfile',
  method: 'GET',
  path: '/user/me',
  tags: ['user'],
  parameters: [ast.factory.createParameter({ name: 'X-Request-Id', in: 'header', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

describe('queryGenerator operation', () => {
  const testData = [
    { name: 'findByTags', node: findByTagsNode, options: {} },
    { name: 'getPetById', node: getPetByIdNode, options: {} },
    { name: 'pluginClient', node: getPetByIdNode, options: { client: { kind: 'contract', pluginName: 'plugin-client' } } },
    { name: 'findByStatusAllOptional', node: findByStatusNode, options: {} },
    {
      name: 'createUsersWithListInputAsQuery',
      node: createUsersWithListInputNode,
      options: { query: { importPath: '@tanstack/react-query', methods: ['post'] } },
    },
    { name: 'headersOnly', node: headersOnlyNode, options: {} },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginReactQuery['resolvedOptions']>; baseURL?: string }>

  test.each(testData)('$name', async (props) => {
    const options: PluginReactQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver(props.name, plugins)

    await renderGeneratorOperation(queryGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})

describe('queryGenerator queryKey', () => {
  test('passes the query variant to a custom queryKey', async () => {
    const queryKey = vi.fn<Transformer>(queryKeyTransformer)
    const options: PluginReactQuery['resolvedOptions'] = { ...defaultOptions, queryKey }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver('customQueryKey', plugins)

    await renderGeneratorOperation(queryGenerator, findByTagsNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    expect(queryKey.mock.calls.map(([props]) => props.variant)).toEqual(['query'])
  })

  test('wraps queryKeyTransformer and customizes the key based on variant', async () => {
    const queryKey: Transformer = (props) => {
      const base = queryKeyTransformer(props)
      return props.variant === 'query' ? ["'customPrefix'", ...base] : base
    }
    const options: PluginReactQuery['resolvedOptions'] = { ...defaultOptions, queryKey }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver('wrappedQueryKey', plugins)

    await renderGeneratorOperation(queryGenerator, findByTagsNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    const file = driver.fileManager.files[0]
    const keySource = file?.sources.find((s) => 'name' in s && s.name === 'findPetsByTagsQueryKey')
    expect(keySource).toMatchObject({
      name: 'findPetsByTagsQueryKey',
      isExportable: true,
      nodes: [
        expect.objectContaining({
          kind: 'ArrowFunction',
          nodes: [
            expect.objectContaining({
              value: "['customPrefix', { url: '/pet/findByTags' }, ...(query ? [query] : [])] as const",
            }),
          ],
        }),
      ],
    })
  })
})
