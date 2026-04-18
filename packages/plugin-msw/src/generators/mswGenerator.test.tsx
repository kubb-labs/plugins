/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */
import type { Config } from '@kubb/core'
import { ast } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from '@kubb/core/mocks'
import { pluginFakerName, resolverFaker } from '@kubb/plugin-faker'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverMsw } from '../resolvers/resolverMsw.ts'
import type { PluginMsw } from '../types.ts'
import { mswGenerator } from './mswGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginMsw['resolvedOptions'] = {
  output: { path: '.' },
  parser: 'data',
  baseURL: undefined,
  group: undefined,
  exclude: [],
  include: undefined,
  override: [],
  handlers: false,
  transformers: {},
  resolver: resolverMsw,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const mockedFakerPlugin = createMockedPlugin<any>({
  name: pluginFakerName,
  options: { output: { path: '.' }, group: undefined },
  resolver: resolverFaker,
})

const listPetsNode = ast.createOperation({
  operationId: 'listPets',
  method: 'GET',
  path: '/pets',
  tags: ['pets'],
  parameters: [ast.createParameter({ name: 'limit', in: 'query', schema: ast.createSchema({ type: 'string' }) })],
  responses: [
    ast.createResponse({
      statusCode: '200',
      description: 'A paged array of pets',
      schema: ast.createSchema({ type: 'array', items: [ast.createSchema({ type: 'object', properties: [] })] }),
    }),
    ast.createResponse({ statusCode: '400', description: 'Invalid', schema: ast.createSchema({ type: 'void' }) }),
    ast.createResponse({ statusCode: 'default', description: 'unexpected error', schema: ast.createSchema({ type: 'object', properties: [] }) }),
  ],
})

const showPetByIdNode = ast.createOperation({
  operationId: 'showPetById',
  method: 'GET',
  path: '/pets/{petId}',
  tags: ['pets'],
  parameters: [
    ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true }),
    ast.createParameter({ name: 'testId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true }),
  ],
  responses: [
    ast.createResponse({
      statusCode: '200',
      description: 'Expected response to a valid request',
      schema: ast.createSchema({ type: 'object', properties: [] }),
    }),
    ast.createResponse({ statusCode: 'default', description: 'unexpected error', schema: ast.createSchema({ type: 'object', properties: [] }) }),
  ],
})

const createPetsNode = ast.createOperation({
  operationId: 'createPets',
  method: 'POST',
  path: '/pets',
  tags: ['pets'],
  requestBody: { required: true, schema: ast.createSchema({ type: 'object', properties: [] }) },
  responses: [
    ast.createResponse({ statusCode: '201', description: 'Null response', schema: ast.createSchema({ type: 'void' }) }),
    ast.createResponse({ statusCode: 'default', description: 'unexpected error', schema: ast.createSchema({ type: 'object', properties: [] }) }),
  ],
})

const deletePetsPetidNode = ast.createOperation({
  operationId: 'deletePetsPetid',
  method: 'DELETE',
  path: '/pets/{petId}',
  tags: ['pets'],
  parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
  responses: [ast.createResponse({ statusCode: '200', description: 'deleted', schema: ast.createSchema({ type: 'void' }) })],
})

describe('mswGenerator operation', () => {
  const testData = [
    { name: 'showPetById', node: showPetByIdNode, options: {} },
    { name: 'getPets', node: listPetsNode, options: {} },
    { name: 'getPetsTemplateBaseUrl', node: listPetsNode, options: { baseURL: '${123456}' } },
    { name: 'getPetsFaker', node: listPetsNode, options: { parser: 'faker' as const } },
    { name: 'createPet', node: createPetsNode, options: {} },
    { name: 'deletePet', node: deletePetsPetidNode, options: {} },
    { name: 'createPetFaker', node: createPetsNode, options: { parser: 'faker' as const } },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginMsw['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginMsw['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginMsw>({ name: 'plugin-msw', options, resolver: resolverMsw })
    const driver = createMockedPluginDriver({ name: props.name })

    driver.getPlugin = ((pluginName: string) => {
      if (pluginName === 'plugin-ts') return mockedTsPlugin
      if (pluginName === pluginFakerName) return mockedFakerPlugin
      return undefined
    }) as typeof driver.getPlugin

    driver.getResolver = ((pluginName: string) => {
      if (pluginName === 'plugin-ts') return mockedTsPlugin.resolver
      if (pluginName === pluginFakerName) return mockedFakerPlugin.resolver
      return undefined
    }) as typeof driver.getResolver

    await renderGeneratorOperation(mswGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverMsw,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})
