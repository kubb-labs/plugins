/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import { ast } from '@kubb/kit'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { resolverClient } from '@kubb/plugin-client'
import { describe, expect, test, vi } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMultiPluginDriver, renderGeneratorOperation, testConfig } from '#mocks'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import type { Transformer } from '@internals/tanstack-query'
import { resolverSwr } from '../resolvers/resolverSwr.ts'
import type { PluginSwr } from '../types.ts'
import { queryGenerator } from './queryGenerator.tsx'

const defaultOptions: PluginSwr['resolvedOptions'] = {
  client: { kind: 'contract', pluginName: 'plugin-axios' },
  queryKey: queryKeyTransformer,
  mutationKey: mutationKeyTransformer,
  query: {
    importPath: 'swr',
    methods: ['GET'],
  },
  mutation: {
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    importPath: 'swr/mutation',
  },
  exclude: [],
  include: undefined,
  override: [],
  output: { path: '.', mode: 'directory' },
  group: undefined,
  resolver: resolverSwr,
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

const plugins = { 'plugin-ts': mockedTsPlugin, 'plugin-axios': mockedAxiosPlugin }

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
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

describe('queryGenerator queryKey', () => {
  test('passes the query variant to a custom queryKey', async () => {
    const queryKey = vi.fn<Transformer>(queryKeyTransformer)
    const options: PluginSwr['resolvedOptions'] = { ...defaultOptions, queryKey }
    const plugin = createMockedPlugin<PluginSwr>({ name: 'plugin-swr', options, resolver: resolverSwr })
    const driver = createMultiPluginDriver('customQueryKey', plugins)

    await renderGeneratorOperation(queryGenerator, findByTagsNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverSwr,
    })

    expect(queryKey.mock.calls.map(([props]) => props.variant)).toEqual(['query'])
  })
})
