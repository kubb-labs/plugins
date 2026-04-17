import type { Config } from '@kubb/core'
import { ast } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from '@kubb/core/mocks'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { MutationKey, QueryKey } from '../components'
import { resolverVueQuery } from '../resolvers/resolverVueQuery.ts'
import type { PluginVueQuery } from '../types.ts'
import { mutationGenerator } from './mutationGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginVueQuery['resolvedOptions'] = {
  client: {
    dataReturnType: 'data',
    client: 'axios',
    clientType: 'function',
    importPath: undefined,
    bundle: false,
  },
  parser: 'zod',
  paramsType: 'inline',
  paramsCasing: undefined,
  pathParamsType: 'inline',
  queryKey: QueryKey.getTransformer,
  mutationKey: MutationKey.getTransformer,
  query: {
    importPath: '@tanstack/vue-query',
    methods: ['get'],
  },
  mutation: {
    methods: ['post'],
    importPath: '@tanstack/vue-query',
  },
  infinite: false,
  output: { path: '.' },
  group: undefined,
  exclude: [],
  include: undefined,
  override: [],
  resolver: resolverVueQuery,
  transformers: {},
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const findByTagsNode = ast.createOperation({
  operationId: 'findPetsByTags',
  method: 'GET',
  path: '/pet/findByTags',
  tags: ['pet'],
  parameters: [
    ast.createParameter({
      name: 'tags',
      in: 'query',
      schema: ast.createSchema({ type: 'array', items: [ast.createSchema({ type: 'string' })] }),
      required: true,
    }),
  ],
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

const updatePetWithFormNode = ast.createOperation({
  operationId: 'updatePetWithForm',
  method: 'POST',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
  requestBody: { schema: ast.createSchema({ type: 'object', properties: [] }) },
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

const deletePetNode = ast.createOperation({
  operationId: 'deletePet',
  method: 'DELETE',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [
    ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true }),
    ast.createParameter({ name: 'api_key', in: 'header', schema: ast.createSchema({ type: 'string' }) }),
  ],
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'void' }), description: 'successful operation' })],
})

describe('mutationGenerator operation', () => {
  const testData = [
    { name: 'getAsMutation', node: findByTagsNode, options: { mutation: { importPath: 'custom-swr/mutation', methods: ['get'] } } },
    { name: 'clientPostImportPath', node: updatePetWithFormNode, options: { client: { dataReturnType: 'data' as const, importPath: 'axios' as const } } },
    {
      name: 'updatePetByIdWithCustomMutationKey',
      node: updatePetWithFormNode,
      options: {
        mutationKey(props) {
          const id = props.node.operationId
          const keys = MutationKey.getTransformer(props)
          return [`"${id}"`, ...keys]
        },
      },
    },
    { name: 'updatePetById', node: updatePetWithFormNode, options: {} },
    { name: 'updatePetByIdPathParamsObject', node: updatePetWithFormNode, options: { pathParamsType: 'object' as const } },
    { name: 'deletePet', node: deletePetNode, options: {} },
    { name: 'deletePetObject', node: deletePetNode, options: { paramsType: 'object' as const, pathParamsType: 'object' as const } },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginVueQuery['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginVueQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginVueQuery>({ name: 'plugin-vue-query', options, resolver: resolverVueQuery })
    const driver = createMockedPluginDriver({
      name: props.name,
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

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
