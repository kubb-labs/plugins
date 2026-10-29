import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { hookOptionsGenerator } from './hookOptionsGenerator.tsx'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperations, testConfig } from '#mocks'

function createOptions(overrides: Partial<PluginReactQuery['resolvedOptions']> = {}): PluginReactQuery['resolvedOptions'] {
  return {
    client: { kind: 'contract', pluginName: 'plugin-axios' },
    queryKey: queryKeyTransformer,
    mutationKey: mutationKeyTransformer,
    query: { importPath: '@tanstack/react-query', methods: ['GET'] },
    mutation: { methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: '@tanstack/react-query' },
    suspense: false,
    infinite: false,
    customOptions: { importPath: './useOptions', name: 'useMyHookOptions' },
    hooks: true,
    exclude: [],
    include: undefined,
    override: [],
    output: { path: '.', mode: 'directory' },
    group: null,
    resolver: resolverReactQuery,
    ...overrides,
  }
}

const operationNodes = [
  ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pet/{petId}', tags: ['pet'], responses: [] }),
  ast.factory.createOperation({ operationId: 'deletePet', method: 'DELETE', path: '/pet/{petId}', tags: ['pet'], responses: [] }),
]

async function renderHookOptionsSource(options: PluginReactQuery['resolvedOptions']) {
  const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
  const driver = createMockedPluginDriver({ name: 'hookOptions', config: testConfig })

  await renderGeneratorOperations(hookOptionsGenerator, operationNodes, {
    config: testConfig,
    adapter: createMockedAdapter(),
    driver,
    plugin,
    options,
    resolver: resolverReactQuery,
  })

  return driver.fileManager.files.flatMap((file) => file.sources.flatMap((source) => ast.extractStringsFromNodes(source.nodes ?? []))).join('\n')
}

describe('hookOptionsGenerator operations', () => {
  test('lists the query and mutation hooks', async () => {
    const source = await renderHookOptionsSource(createOptions())

    expect(source).toContain('"useGetPetById": Partial<ReturnType<typeof getPetByIdQueryOptions>>')
    expect(source).toContain('"useDeletePet": Partial<ReturnType<typeof deletePetMutationOptions>>')
  })

  test('skips an operation whose override sets query: false', async () => {
    const source = await renderHookOptionsSource(createOptions({ override: [{ type: 'operationId', pattern: 'getPetById', options: { query: false } }] }))

    expect(source).not.toContain('useGetPetById')
    expect(source).toContain('"useDeletePet"')
  })
})
