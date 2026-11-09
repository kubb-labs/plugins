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
import { mutationGenerator } from './mutationGenerator.tsx'

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

const updatePetWithFormNode = ast.factory.createOperation({
  operationId: 'updatePetWithForm',
  method: 'POST',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
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

describe('mutationGenerator mutationKey', () => {
  test('passes the mutation variant to a custom mutationKey', async () => {
    const mutationKey = vi.fn<Transformer>(mutationKeyTransformer)
    const options: PluginSwr['resolvedOptions'] = { ...defaultOptions, mutationKey }
    const plugin = createMockedPlugin<PluginSwr>({ name: 'plugin-swr', options, resolver: resolverSwr })
    const driver = createMultiPluginDriver('customMutationKey', plugins)

    await renderGeneratorOperation(mutationGenerator, updatePetWithFormNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverSwr,
    })

    expect(mutationKey.mock.calls.map(([props]) => props.variant)).toEqual(['mutation'])
  })
})
