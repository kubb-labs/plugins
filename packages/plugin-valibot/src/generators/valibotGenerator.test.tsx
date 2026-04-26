import path from 'node:path'
import type { Config } from '@kubb/core'
import { ast, FileProcessor } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation, renderGeneratorSchema } from '@kubb/core/mocks'
import { parserTs } from '@kubb/parser-ts'
import { describe, expect, test } from 'vitest'
import { resolverValibot } from '../resolvers/resolverValibot.ts'
import type { PluginValibot } from '../types.ts'
import { buildSchemaNames } from '../utils.ts'
import { valibotGenerator } from './valibotGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

async function matchFiles(files: Array<ast.FileNode> | undefined, pre: string) {
  if (!files?.length) return

  const fileProcessor = new FileProcessor()
  const parsers = new Map<`.${string}`, typeof parserTs>()
  parsers.set('.ts', parserTs)

  for (const file of files) {
    if (!file?.path) continue

    const code = await fileProcessor.parse(file, { parsers })
    const snapshotPath = path.join('__snapshots__', pre, file.baseName)
    await expect(code).toMatchFileSnapshot(snapshotPath)
  }
}

const defaultOptions: PluginValibot['resolvedOptions'] = {
  dateType: 'string',
  typed: false,
  inferred: false,
  importPath: 'valibot',
  coercion: false,
  operations: false,
  guidType: 'uuid',
  optionalType: 'optional',
  defaultMode: 'default',
  metadata: { description: true },
  readonly: false,
  wrapOutput: undefined,
  paramsCasing: undefined,
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
  group: undefined,
  printer: undefined,
}

describe('valibotGenerator — Schema', () => {
  test('object schema', async () => {
    const node = ast.createSchema({
      type: 'object',
      primitive: 'object',
      name: 'Pet',
      properties: [
        ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'integer' }) }),
        ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
        ast.createProperty({ name: 'status', schema: ast.createSchema({ type: 'enum', enumValues: ['available', 'pending'], optional: true }) }),
      ],
    })

    const plugin = createMockedPlugin<PluginValibot>({ name: 'plugin-valibot', options: defaultOptions, resolver: resolverValibot })
    const driver = createMockedPluginDriver({ name: 'object' })

    await renderGeneratorSchema(valibotGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverValibot,
    })

    await matchFiles(driver.fileManager.files, 'object')
  })

  test('inferred type', async () => {
    const options: PluginValibot['resolvedOptions'] = { ...defaultOptions, inferred: true }
    const plugin = createMockedPlugin<PluginValibot>({ name: 'plugin-valibot', options, resolver: resolverValibot })
    const driver = createMockedPluginDriver({ name: 'inferred' })

    await renderGeneratorSchema(valibotGenerator, ast.createSchema({ type: 'string', name: 'PetName' }), {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverValibot,
    })

    await matchFiles(driver.fileManager.files, 'inferred')
  })
})

describe('valibotGenerator — Operation', () => {
  test('skips response names when responses have no schema', () => {
    const node = ast.createOperation({
      operationId: 'ping',
      method: 'GET',
      path: '/ping',
      tags: ['health'],
      responses: [{ statusCode: '204', description: 'No content' } as unknown as ast.ResponseNode],
    })

    const data = buildSchemaNames(node, { params: [], resolver: resolverValibot })

    expect(data.responses).toEqual({})
    expect(data.errors).toEqual({})
  })

  test('GET with query params and response', async () => {
    const node = ast.createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      tags: ['pets'],
      parameters: [ast.createParameter({ name: 'limit', in: 'query', schema: ast.createSchema({ type: 'integer' }) })],
      responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', primitive: 'object', properties: [] }), description: 'A paged array of pets' })],
    })

    const plugin = createMockedPlugin<PluginValibot>({ name: 'plugin-valibot', options: defaultOptions, resolver: resolverValibot })
    const driver = createMockedPluginDriver({ name: 'listPets' })

    await renderGeneratorOperation(valibotGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverValibot,
    })

    await matchFiles(driver.fileManager.files, 'listPets')
  })
})
