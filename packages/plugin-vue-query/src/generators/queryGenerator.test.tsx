/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

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
import { queryGenerator } from './queryGenerator.tsx'

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
    importPath: '@tanstack/react-query',
    methods: ['get'],
  },
  mutation: {
    methods: ['post'],
    importPath: '@tanstack/react-query',
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
    ast.createParameter({ name: 'status', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
  ],
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

const updatePetWithFormNode = ast.createOperation({
  operationId: 'updatePetWithForm',
  method: 'POST',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [
    ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true }),
    ast.createParameter({ name: 'status', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
  ],
  requestBody: { schema: ast.createSchema({ type: 'object', properties: [] }) },
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

describe('queryGenerator operation', () => {
  const testData = [
    { name: 'findByTags', node: findByTagsNode, options: {} },
    { name: 'findByTagsTemplateString', node: findByTagsNode, options: {}, baseURL: '${123456}' },
    { name: 'findByTagsPathParamsObject', node: findByTagsNode, options: { pathParamsType: 'object' as const } },
    { name: 'findByTagsWithZod', node: findByTagsNode, options: { parser: 'zod' as const } },
    {
      name: 'findByTagsWithCustomQueryKey',
      node: findByTagsNode,
      options: {
        query: {
          methods: ['get'],
          importPath: '@tanstack/react-query',
        },
        queryKey(props) {
          const keys = QueryKey.getTransformer(props)
          return ['"test"', ...keys]
        },
      },
    },
    { name: 'clientGetImportPath', node: findByTagsNode, options: { client: { dataReturnType: 'data' as const, importPath: 'axios' as const } } },
    { name: 'clientDataReturnTypeFull', node: findByTagsNode, options: { client: { dataReturnType: 'full' as const, client: 'axios' as const } } },
    {
      name: 'postAsQuery',
      node: updatePetWithFormNode,
      options: {
        query: {
          importPath: 'custom-query',
          methods: ['post'],
        },
      },
    },
    { name: 'findByTagsObject', node: findByTagsNode, options: { paramsType: 'object' as const, pathParamsType: 'object' as const } },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginVueQuery['resolvedOptions']>; baseURL?: string }>

  test.each(testData)('$name', async (props) => {
    const options: PluginVueQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginVueQuery>({ name: 'plugin-vue-query', options, resolver: resolverVueQuery })
    const driver = createMockedPluginDriver({ name: props.name, plugin: mockedTsPlugin })

    await renderGeneratorOperation(queryGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter({
        inputNode: { kind: 'Input', schemas: [], operations: [], meta: { baseURL: 'baseURL' in props ? props.baseURL : undefined } },
      }),
      driver,
      plugin,
      options,
      resolver: resolverVueQuery,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})
