import path from 'node:path'
import type { Resolver } from '@kubb/core'
import { resolverClient } from '@kubb/plugin-client'
import { resolverCypress } from '@kubb/plugin-cypress'
import { resolverFaker } from '@kubb/plugin-faker'
import { resolverMcp } from '@kubb/plugin-mcp'
import { resolverTs } from '@kubb/plugin-ts'
import { resolverZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'

const resolvers: ReadonlyArray<{ name: string; resolver: Resolver }> = [
  { name: 'plugin-client', resolver: resolverClient },
  { name: 'plugin-cypress', resolver: resolverCypress },
  { name: 'plugin-faker', resolver: resolverFaker },
  { name: 'plugin-mcp', resolver: resolverMcp },
  { name: 'plugin-ts', resolver: resolverTs },
  { name: 'plugin-zod', resolver: resolverZod },
]

const baseMethods = ['default', 'resolveOptions', 'resolvePath', 'resolveFile', 'resolveBanner', 'resolveFooter'] as const

describe.each(resolvers)('plugin conformance: $name', ({ resolver }) => {
  test('exposes the base resolver contract', () => {
    expect(typeof resolver.name).toBe('string')
    expect(typeof resolver.pluginName).toBe('string')
    for (const method of baseMethods) {
      expect(typeof resolver[method]).toBe('function')
    }
  })

  test('resolveFile keeps generated files inside the output root', () => {
    const root = path.resolve('/tmp/kubb-conformance')
    const output = { path: 'src/gen' }

    const file = resolver.resolveFile({ name: 'getPet', extname: '.ts' }, { root, output, group: undefined })
    const outputRoot = path.resolve(root, output.path)

    expect(path.resolve(file.path).startsWith(outputRoot)).toBe(true)
  })
})
