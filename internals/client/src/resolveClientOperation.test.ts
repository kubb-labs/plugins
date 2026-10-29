import path from 'node:path'
import { ast, createResolver } from 'kubb/kit'
import type { Memo, Resolver } from 'kubb/kit'
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

    const result = resolveClientOperation({ clientPlugin: null, driver, node, root: '/root', output: { path: '.' }, memo: createTestMemo() })

    expect(result).toBeNull()
    expect(driver.getResolver).not.toHaveBeenCalled()
  })

  test('resolves the operation name, file path, and client runtime path', () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()

    const result = resolveClientOperation({
      clientPlugin: { pluginName: 'plugin-fetch' },
      driver,
      node,
      root: '/root',
      output: { path: '.' },
      memo: createTestMemo(),
    })

    expect(result).toStrictEqual({
      name: 'getPetById',
      path: '/root/getPetById.ts',
      clientPath: '/root/.kubb/client.ts',
      clientPathIsFile: true,
      returnType: 'full',
    })
  })

  test("resolves plugin-client's relative importPath against the operation file", () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()
    driver.getPlugin.mockReturnValueOnce({ options: { importPath: '../client', returnType: 'plain' } })

    const result = resolveClientOperation({
      clientPlugin: { pluginName: 'plugin-client' },
      driver,
      node,
      root: '/root',
      output: { path: '.' },
      memo: createTestMemo(),
    })

    expect(result).toStrictEqual({ name: 'getPetById', path: '/root/getPetById.ts', clientPath: '/client', clientPathIsFile: true, returnType: 'plain' })
  })

  test("keeps plugin-client's package importPath verbatim", () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()
    driver.getPlugin.mockReturnValueOnce({ options: { importPath: '@my-org/api-client' } })

    const result = resolveClientOperation({
      clientPlugin: { pluginName: 'plugin-client' },
      driver,
      node,
      root: '/root',
      output: { path: '.' },
      memo: createTestMemo(),
    })

    expect(result).toMatchObject({ clientPath: '@my-org/api-client', clientPathIsFile: false })
  })

  test('reuses the cached result for the same client plugin and node instead of resolving again', () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()
    const memo = createTestMemo()

    const first = resolveClientOperation({ clientPlugin: { pluginName: 'plugin-fetch' }, driver, node, root: '/root', output: { path: '.' }, memo })
    const second = resolveClientOperation({ clientPlugin: { pluginName: 'plugin-fetch' }, driver, node, root: '/root', output: { path: '.' }, memo })

    expect(second).toStrictEqual(first)
    expect(driver.getResolver).toHaveBeenCalledOnce()
  })

  test('resolves independently per client plugin name, even sharing the same memo', () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()
    const memo = createTestMemo()

    resolveClientOperation({ clientPlugin: { pluginName: 'plugin-fetch' }, driver, node, root: '/root', output: { path: '.' }, memo })
    resolveClientOperation({ clientPlugin: { pluginName: 'plugin-axios' }, driver, node, root: '/root', output: { path: '.' }, memo })

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
        driver,
        node,
        root: '/root',
        output: { path: '.', mode: 'directory' },
        memo: createTestMemo(),
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

    test('imports from the output path an override moves the operation to', () => {
      const moved = {
        output: { path: './clients', mode: 'directory' },
        override: [{ type: 'operationId', pattern: 'getPetById', options: { output: { path: './admin', mode: 'directory' } } }],
      }

      expect(resolveWith(moved, getPetById)?.path).toBe(path.resolve('/root', 'admin', 'getPetById.ts'))
      expect(resolveWith(moved, listPets)?.path).toBe(path.resolve('/root', 'clients', 'listPets.ts'))
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
        driver,
        node: getPetById,
        root: '/root',
        output: { path: '.', mode: 'directory' },
        memo: createTestMemo(),
      })

      expect(res?.returnType).toBe('full')
    })
  })
})
