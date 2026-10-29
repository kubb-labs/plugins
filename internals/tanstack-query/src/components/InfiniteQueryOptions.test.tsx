import { File, jsxRenderer } from 'kubb/jsx'
import { ast, defineGenerator } from 'kubb/kit'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, rawSources, renderGeneratorOperation, testConfig } from '#mocks'
import { definePageParam } from '../utils.ts'
import { InfiniteQueryOptions } from './InfiniteQueryOptions.tsx'

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

type PageParams = Partial<Parameters<typeof InfiniteQueryOptions>[0]>

const infiniteConfig = {
  queryParam: 'pageSize',
  initialPageParam: 0,
  cursorParam: null,
  nextParam: null,
  previousParam: null,
} as const

const tsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.', mode: 'directory' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const generator = (params: PageParams) =>
  defineGenerator<PluginTs>({
    name: 'infinite-query-options-test',
    renderer: jsxRenderer,
    operation(node) {
      return (
        <File baseName="options.ts" path="/options.ts">
          <InfiniteQueryOptions
            name="findPetsByTagsInfiniteQueryOptions"
            clientName="findPetsByTags"
            queryKeyName="findPetsByTagsInfiniteQueryKey"
            node={node}
            tsResolver={resolverTs}
            {...infiniteConfig}
            {...params}
          />
        </File>
      )
    },
  })

async function render(params: PageParams) {
  const driver = createMockedPluginDriver({ name: 'pageParamCombos' })

  await renderGeneratorOperation(generator(params), findByTagsNode, {
    config: testConfig,
    adapter: createMockedAdapter(),
    driver,
    plugin: tsPlugin,
    options: tsPlugin.options,
    resolver: resolverTs,
  })

  return rawSources(driver.fileManager.files)[0] ?? ''
}

describe('InfiniteQueryOptions page param resolution combinations', () => {
  test('only getNextPageParam is configured', async () => {
    const source = await render({ getNextPageParam: '(lastPage) => lastPage.next' })
    expect(source).toContain('getNextPageParam: (lastPage) => lastPage.next')
    expect(source).not.toContain('getPreviousPageParam')
  })

  test('mixed getNextPageParam and previousParam', async () => {
    const source = await render({ getNextPageParam: '(lastPage) => lastPage.next', previousParam: 'prevCursor' })
    expect(source).toContain('getNextPageParam: (lastPage) => lastPage.next')
    expect(source).toContain("getPreviousPageParam: (firstPage) => firstPage?.['prevCursor']")
  })

  test('mixed nextParam and getPreviousPageParam', async () => {
    const source = await render({ nextParam: 'nextCursor', getPreviousPageParam: '(firstPage) => firstPage.prev' })
    expect(source).toContain("getNextPageParam: (lastPage) => lastPage?.['nextCursor']")
    expect(source).toContain('getPreviousPageParam: (firstPage) => firstPage.prev')
  })

  test('only getPreviousPageParam is configured falls back to default getNextPageParam', async () => {
    const source = await render({ getPreviousPageParam: '(firstPage) => firstPage.prev' })
    expect(source).toContain('getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage)')
    expect(source).toContain('getPreviousPageParam: (firstPage) => firstPage.prev')
  })

  test('supports definePageParam helper', async () => {
    const source = await render({ getNextPageParam: definePageParam<{ next?: number }>((lastPage) => lastPage.next) })
    expect(source).toContain('getNextPageParam: (lastPage) => lastPage.next')
    expect(source).not.toContain('getPreviousPageParam')
  })

  test('supports function expression directly in config', async () => {
    const source = await render({ getNextPageParam: (lastPage: any) => lastPage.cursor })
    expect(source).toContain('getNextPageParam: (lastPage) => lastPage.cursor')
  })

  test('default initialPageParam keeps legacy <= 1 previous page check', async () => {
    const source = await render({ initialPageParam: 0, hasExplicitInitialPageParam: false })
    expect(source).toContain('getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => firstPageParam <= 1 ? undefined : firstPageParam - 1')
  })

  test('explicit initialPageParam: 0 sets <= 0 previous page check', async () => {
    const source = await render({ initialPageParam: 0, hasExplicitInitialPageParam: true })
    expect(source).toContain('getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => firstPageParam <= 0 ? undefined : firstPageParam - 1')
  })

  test('explicit initialPageParam: null sets initialPageParam: null', async () => {
    const source = await render({ initialPageParam: null, hasExplicitInitialPageParam: true, getNextPageParam: '(lastPage) => lastPage.next' })
    expect(source).toContain('initialPageParam: null')
  })
})
