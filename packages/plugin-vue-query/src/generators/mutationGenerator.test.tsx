import { ast } from 'kubb/kit'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { resolverClient } from '@internals/client'
import { describe, expect, test, vi } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMultiPluginDriver, matchFiles, renderGeneratorOperation, testConfig } from '#mocks'
import { mutationKeyTransformer } from '@internals/tanstack-query'
import { queryKeyTransformer } from '@internals/tanstack-query'
import type { Transformer } from '@internals/tanstack-query'
import { resolverVueQuery } from '../resolvers/resolverVueQuery.ts'
import type { PluginVueQuery } from '../types.ts'
import { mutationGenerator } from './mutationGenerator.tsx'

const defaultOptions: PluginVueQuery['resolvedOptions'] = {
  client: { kind: 'contract', pluginName: 'plugin-axios' },
  queryKey: queryKeyTransformer,
  mutationKey: mutationKeyTransformer,
  query: {
    importPath: '@tanstack/vue-query',
    methods: ['GET'],
  },
  mutation: {
    methods: ['POST'],
    importPath: '@tanstack/vue-query',
  },
  infinite: false,
  output: { path: '.', mode: 'directory' },
  group: null,
  exclude: [],
  include: undefined,
  override: [],
  hooks: true,
  resolver: resolverVueQuery,
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
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

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

const setPropertyNode = ast.factory.createOperation({
  operationId: 'setProperty',
  method: 'PUT',
  path: '/properties',
  requestBody: {
    required: true,
    content: [
      ast.factory.createContent({
        contentType: 'application/json',
        schema: ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'value', required: false, schema: ast.factory.createSchema({ type: 'string' }) })],
        }),
      }),
    ],
  },
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'string' }) })],
})

const deletePetNode = ast.factory.createOperation({
  operationId: 'deletePet',
  method: 'DELETE',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [
    ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
    ast.factory.createParameter({ name: 'api_key', in: 'header', schema: ast.factory.createSchema({ type: 'string' }) }),
  ],
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'void' }), description: 'successful operation' })],
})

describe('mutationGenerator operation', () => {
  const testData = [
    { name: 'getAsMutation', node: findByTagsNode, options: { mutation: { importPath: 'custom-swr/mutation', methods: ['get'] } } },
    {
      name: 'updatePetByIdWithCustomMutationKey',
      node: updatePetWithFormNode,
      options: {
        mutationKey(props) {
          const id = props.node.operationId
          const keys = mutationKeyTransformer(props)
          return [`"${id}"`, ...keys]
        },
      },
    },
    { name: 'updatePetById', node: updatePetWithFormNode, options: {} },
    { name: 'deletePet', node: deletePetNode, options: {} },
    { name: 'bodyWithValueProperty', node: setPropertyNode, options: { mutation: { importPath: '@tanstack/vue-query', methods: ['PUT'] } } },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginVueQuery['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginVueQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginVueQuery>({ name: 'plugin-vue-query', options, resolver: resolverVueQuery })
    const driver = createMultiPluginDriver(props.name, plugins)

    await renderGeneratorOperation(mutationGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverVueQuery,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})

describe('mutationGenerator mutationKey', () => {
  test('passes the mutation variant to a custom mutationKey', async () => {
    const mutationKey = vi.fn<Transformer>(mutationKeyTransformer)
    const options: PluginVueQuery['resolvedOptions'] = { ...defaultOptions, mutationKey }
    const plugin = createMockedPlugin<PluginVueQuery>({ name: 'plugin-vue-query', options, resolver: resolverVueQuery })
    const driver = createMultiPluginDriver('customMutationKey', plugins)

    await renderGeneratorOperation(mutationGenerator, updatePetWithFormNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverVueQuery,
    })

    expect(mutationKey.mock.calls.map(([props]) => props.variant)).toEqual(['mutation'])
  })
})
