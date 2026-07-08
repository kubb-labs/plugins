/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */
import type { Config } from 'kubb/kit'
import { ast, memoryStorage } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from 'kubb/kit/testing'
import type { PluginFaker } from '@kubb/plugin-faker'
import { pluginFakerName, resolverFaker } from '@kubb/plugin-faker'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverMsw } from '../resolvers/resolverMsw.ts'
import type { PluginMsw } from '../types.ts'
import { mswGenerator } from './mswGenerator.tsx'

const testConfig: Config = {
  root: '.',
  input: '',
  output: { path: 'test' },
  plugins: [],
  parsers: [],
  reporters: [],
  adapter: createMockedAdapter(),
  storage: memoryStorage(),
}

const defaultOptions: PluginMsw['resolvedOptions'] = {
  output: { path: '.' },
  parser: 'data',
  baseURL: undefined,
  group: null,
  exclude: [],
  include: undefined,
  override: [],
  handlers: false,
  resolver: resolverMsw,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const mockedFakerPlugin = createMockedPlugin<PluginFaker>({
  name: pluginFakerName,
  options: { output: { path: '.' }, group: null } as PluginFaker['resolvedOptions'],
  resolver: resolverFaker,
})

const listPetsNode = ast.factory.createOperation({
  operationId: 'listPets',
  method: 'GET',
  path: '/pets',
  tags: ['pets'],
  parameters: [ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      description: 'A paged array of pets',
      schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'object', properties: [] })] }),
    }),
    ast.factory.createResponse({ statusCode: '400', description: 'Invalid', schema: ast.factory.createSchema({ type: 'void' }) }),
    ast.factory.createResponse({
      statusCode: 'default',
      description: 'unexpected error',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
    }),
  ],
})

const showPetByIdNode = ast.factory.createOperation({
  operationId: 'showPetById',
  method: 'GET',
  path: '/pets/{petId}',
  tags: ['pets'],
  parameters: [
    ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
    ast.factory.createParameter({ name: 'testId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      description: 'Expected response to a valid request',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
    }),
    ast.factory.createResponse({
      statusCode: 'default',
      description: 'unexpected error',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
    }),
  ],
})

const createPetsNode = ast.factory.createOperation({
  operationId: 'createPets',
  method: 'POST',
  path: '/pets',
  tags: ['pets'],
  requestBody: {
    required: true,
    content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
  },
  responses: [
    ast.factory.createResponse({ statusCode: '201', description: 'Null response', schema: ast.factory.createSchema({ type: 'void' }) }),
    ast.factory.createResponse({
      statusCode: 'default',
      description: 'unexpected error',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
    }),
  ],
})

const deletePetsPetidNode = ast.factory.createOperation({
  operationId: 'deletePetsPetid',
  method: 'DELETE',
  path: '/pets/{petId}',
  tags: ['pets'],
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  responses: [ast.factory.createResponse({ statusCode: '200', description: 'deleted', schema: ast.factory.createSchema({ type: 'void' }) })],
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
