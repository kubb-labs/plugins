import path from 'node:path'
import { ast, createResolver } from '@kubb/kit'
import type { Memo, Resolver } from '@kubb/kit'
import { describe, expect, test, vi } from 'vitest'
import { resolveClientOperation } from './resolveClientOperation.ts'

function createTestMemo(): Memo {
  const store = new Map<string, unknown>()
  return ((key: string, compute: () => unknown) => {
    if (!store.has(key)) store.set(key, compute())
    return store.get(key)
  }) as Memo
}

function createDriver() {
  const resolver = createResolver({ pluginName: 'plugin-fetch', name: (name: string) => name, file: { path: () => '/root/getPetById.ts' } })
  const getResolver = vi.fn(() => resolver)
  const getPlugin = vi.fn(() => ({ options: {} }))
  return { getPlugin, getResolver }
}

describe('resolveClientOperation', () => {
  test('returns null when no contract client plugin is registered', () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()

    const result = resolveClientOperation({ clientPlugin: null, ctx: { ...driver, memo: createTestMemo() }, node, root: '/root', output: { path: '.' } })

    expect(result).toBeNull()
    expect(driver.getResolver).not.toHaveBeenCalled()
  })

  test('reuses the cached result for the same client plugin and node instead of resolving again', () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()
    const memo = createTestMemo()

    const first = resolveClientOperation({ clientPlugin: { pluginName: 'plugin-fetch' }, ctx: { ...driver, memo }, node, root: '/root', output: { path: '.' } })
    const second = resolveClientOperation({
      clientPlugin: { pluginName: 'plugin-fetch' },
      ctx: { ...driver, memo },
      node,
      root: '/root',
      output: { path: '.' },
    })

    expect(second).toStrictEqual(first)
    expect(driver.getResolver).toHaveBeenCalledOnce()
  })

  test('resolves independently per client plugin name, even sharing the same memo', () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()
    const memo = createTestMemo()

    resolveClientOperation({ clientPlugin: { pluginName: 'plugin-fetch' }, ctx: { ...driver, memo }, node, root: '/root', output: { path: '.' } })
    resolveClientOperation({ clientPlugin: { pluginName: 'plugin-axios' }, ctx: { ...driver, memo }, node, root: '/root', output: { path: '.' } })

    expect(driver.getResolver).toHaveBeenCalledTimes(2)
    expect(driver.getResolver).toHaveBeenNthCalledWith(1, 'plugin-fetch')
    expect(driver.getResolver).toHaveBeenNthCalledWith(2, 'plugin-axios')
  })

  // A real resolver, so the client plugin's filters go through Kubb's own `resolver.default.options`.
  describe("scoped by the client plugin's per-operation options", () => {
    const getPetById = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const listPets = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    function resolveWith(pluginOptions: Record<string, unknown>, node: ast.OperationNode) {
      const resolver = createResolver({ pluginName: 'plugin-axios' }) as unknown as Resolver
      const driver = { getPlugin: () => ({ options: pluginOptions }), getResolver: () => resolver }

      return resolveClientOperation({
        clientPlugin: { pluginName: 'plugin-axios' },
        ctx: { ...driver, memo: createTestMemo() },
        node,
        root: '/root',
        output: { path: '.', mode: 'directory' },
      })
    }

    const returnTypeOverride = {
      output: { path: './clients', mode: 'directory' },
      returnType: 'data',
      override: [{ type: 'operationId', pattern: 'getPetById', options: { returnType: 'full' } }],
    }

    test('applies an override returnType to the operation it matches', () => {
      expect(resolveWith(returnTypeOverride, getPetById)?.returnType).toBe('full')
    })

    test('keeps the global returnType for operations an override does not match', () => {
      expect(resolveWith(returnTypeOverride, listPets)?.returnType).toBe('data')
    })

    test('resolves a relative importPath from the folder an override moves the operation to', () => {
      const moved = {
        output: { path: './clients', mode: 'directory' },
        importPath: './client',
        override: [{ type: 'operationId', pattern: 'getPetById', options: { output: { path: './admin', mode: 'directory' }, importPath: './client' } }],
      }

      expect(resolveWith(moved, getPetById)?.clientPath).toBe(path.resolve('/root', 'admin', 'client'))
      expect(resolveWith(moved, listPets)?.clientPath).toBe(path.resolve('/root', 'clients', 'client'))
    })

    test('names the client plugin, so the import resolves to wherever it emitted the operation', () => {
      expect(resolveWith(returnTypeOverride, getPetById)?.plugin).toBe('plugin-axios')
    })

    test('returns null for an operation the client plugin excludes, since it emits no <op>', () => {
      const options = { output: { path: '.', mode: 'directory' }, exclude: [{ type: 'operationId', pattern: 'getPetById' }] }

      expect(resolveWith(options, getPetById)).toBeNull()
      expect(resolveWith(options, listPets)).not.toBeNull()
    })

    test('returns null for an operation outside the client plugin include', () => {
      const options = { output: { path: '.', mode: 'directory' }, include: [{ type: 'operationId', pattern: 'listPets' }] }

      expect(resolveWith(options, getPetById)).toBeNull()
      expect(resolveWith(options, listPets)).not.toBeNull()
    })

    test('exclude takes precedence over include when an operation matches both', () => {
      const taggedPet = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}', tags: ['pets'] })
      const otherTaggedPet = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets', tags: ['pets'] })
      const conflictConfig = {
        output: { path: '.', mode: 'directory' },
        include: [{ type: 'tag', pattern: 'pets' }],
        exclude: [{ type: 'operationId', pattern: 'getPetById' }],
      }

      expect(resolveWith(conflictConfig, taggedPet)).toBeNull()
      expect(resolveWith(conflictConfig, otherTaggedPet)).not.toBeNull()
    })

    test('handles missing plugin options gracefully', () => {
      const resolver = createResolver({ pluginName: 'plugin-axios' }) as unknown as Resolver
      const driver = { getPlugin: () => undefined, getResolver: () => resolver }

      const res = resolveClientOperation({
        clientPlugin: { pluginName: 'plugin-axios' },
        ctx: { ...driver, memo: createTestMemo() },
        node: getPetById,
        root: '/root',
        output: { path: '.', mode: 'directory' },
      })

      expect(res?.returnType).toBe('full')
    })
  })
})
