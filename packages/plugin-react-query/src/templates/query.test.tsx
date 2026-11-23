/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import { ast } from '@internals/ast'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { resolverClient } from '@kubb/plugin-client'
import type { ClientResolvedOptions } from '@kubb/plugin-client'
import { describe, expect, test, vi } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMultiPluginDriver, matchFiles, rawSources, renderTemplate, testConfig } from '#mocks'
import { hookFileName, mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import { Resolver } from '@kubb/kit'
import type { Transformer } from '@internals/tanstack-query'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { queryOperation } from './query.tsx'
import { infiniteQueryOperation } from './infiniteQuery.tsx'
import { suspenseQueryOperation } from './suspenseQuery.tsx'
import { suspenseInfiniteQueryOperation } from './suspenseInfiniteQuery.tsx'

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

// An operation of its own: names and response types are memoized per operation.
const getPetLimitsNode: ast.OperationNode = {
  ...getPetByIdNode,
  operationId: 'getPetLimits',
  path: '/pet/{petId}/limits',
  responses: getPetByIdNode.responses.map((response) => ({
    ...response,
    headers: [ast.factory.createParameter({ name: 'X-Rate-Limit', in: 'header', required: true, schema: ast.factory.createSchema({ type: 'integer' }) })],
  })),
}

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
  test('a name override renames the hook and keeps its file name', () => {
    const resolver = Resolver.merge(resolverReactQuery, {
      name(name: string) {
        return `${name}Api`
      },
    })

    expect(resolver.suspenseQuery.name(getPetByIdNode)).toBe('useGetPetByIdApiSuspense')
    expect(hookFileName({ resolver, node: getPetByIdNode, variant: 'Suspense' })).toBe('useGetPetByIdSuspense')
  })

  const testData = [
    { name: 'findByTags', node: findByTagsNode, options: {} },
    { name: 'getPetById', node: getPetByIdNode, options: {} },
    { name: 'pluginClient', node: getPetByIdNode, options: { client: { kind: 'contract', pluginName: 'plugin-client' } } },
    { name: 'getPetByIdReturnTypeFull', node: getPetByIdNode, options: { returnType: 'full' } },
    { name: 'pluginClientReturnTypeFull', node: getPetByIdNode, options: { client: { kind: 'contract', pluginName: 'plugin-client' }, returnType: 'full' } },
    // Declared response headers are typed on the full result of a generated client. A custom client module keeps untyped headers.
    { name: 'getPetLimitsReturnTypeFullHeaders', node: getPetLimitsNode, options: { returnType: 'full' } },
    {
      name: 'pluginClientReturnTypeFullHeaders',
      node: getPetLimitsNode,
      options: { client: { kind: 'contract', pluginName: 'plugin-client' }, returnType: 'full' },
    },
    { name: 'findByStatusAllOptional', node: findByStatusNode, options: {} },
    {
      name: 'createUsersWithListInputAsQuery',
      node: createUsersWithListInputNode,
      options: { query: { importPath: '@tanstack/react-query', methods: ['post'] } },
    },
    { name: 'headersOnly', node: headersOnlyNode, options: {} },
    {
      name: 'headersInQueryKey',
      node: headersOnlyNode,
      options: { queryKey: (props) => [...queryKeyTransformer(props), '...(headers ? [headers] : [])'] },
    },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginReactQuery['resolvedOptions']>; baseURL?: string }>

  test.each(testData)('$name', async (props) => {
    const options: PluginReactQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver(props.name, plugins)

    await renderTemplate(queryOperation, props.node, {
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

describe('queryGenerator returnType', () => {
  test("rejects returnType 'full' when the client plugin only returns the body", async () => {
    const mockedDataAxiosPlugin = createMockedPlugin({
      name: 'plugin-axios',
      options: { output: { path: './clients', mode: 'directory' }, group: null, returnType: 'data' } as ClientResolvedOptions,
      resolver: resolverClient,
    })
    const options: PluginReactQuery['resolvedOptions'] = { ...defaultOptions, returnType: 'full' }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver('returnTypeConflict', { 'plugin-ts': mockedTsPlugin, 'plugin-axios': mockedDataAxiosPlugin })

    await expect(
      renderTemplate(queryOperation, getPetByIdNode, {
        config: testConfig,
        adapter: createMockedAdapter(),
        driver,
        plugin,
        options,
        resolver: resolverReactQuery,
      }),
    ).rejects.toThrow(/returnType: 'data'/)
  })
})

describe('queryGenerator queryKey', () => {
  test.each([
    ['react-query', queryOperation],
    ['react-infinite-query', infiniteQueryOperation],
    ['react-suspense-query', suspenseQueryOperation],
    ['react-suspense-infinite-query', suspenseInfiniteQueryOperation],
  ])('forwards headers to a custom key with %s', async (_name, template) => {
    const options: PluginReactQuery['resolvedOptions'] = {
      ...defaultOptions,
      suspense: {},
      infinite: { queryParam: 'page', initialPageParam: 0 },
      queryKey: (props) => [...queryKeyTransformer(props), '...(headers ? [headers] : [])'],
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver('headerKey', plugins)

    const node = ast.factory.createOperation({
      ...headersOnlyNode,
      parameters: [
        ...headersOnlyNode.parameters,
        ast.factory.createParameter({ name: 'page', in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) }),
      ],
    })
    await renderTemplate(template, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    const source = rawSources(driver.fileManager.files).join('\n')
    expect(source).toContain('headers?:')
    expect(source).toContain('...(headers ? [headers] : [])')
    expect(source).toMatch(/const queryKey = \w+\({ query, headers }\)/)
  })

  test('passes the query variant to a custom queryKey', async () => {
    const queryKey = vi.fn<Transformer>(queryKeyTransformer)
    const options: PluginReactQuery['resolvedOptions'] = { ...defaultOptions, queryKey }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver('customQueryKey', plugins)

    await renderTemplate(queryOperation, findByTagsNode, {
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

    await renderTemplate(queryOperation, findByTagsNode, {
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
      export: true,
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
