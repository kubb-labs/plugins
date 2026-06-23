import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, type Config, createKubb, Diagnostics, type KubbHooks, fsStorage } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://github.com/kubb-labs/kubb/issues/3661
// A nullable member inside an `allOf` must not leak into a broken `.and(.nullable())`.
describe('nullable allOf (issue #3661)', () => {
  test('generates valid zod for a nullable string inside allOf', async () => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-nullableAllOf-${Date.now()}`)
    const { files, diagnostics } = await createKubb(
      {
        root: __dirname,
        input: { path: '../../schemas/3.0.x/nullableAllOf.yaml' },
        output: { path: tmpDir, barrel: false },
        adapter: adapterOas({ validate: false, enums: 'root' }),
        parsers: [parserTs],
        storage: fsStorage(),
        plugins: [pluginZod({ output: { path: './zod', barrel: false } })],
      } as Config,
      { hooks: new AsyncEventEmitter<KubbHooks>() },
    ).safeBuild()

    expect(Diagnostics.hasError(diagnostics)).toBe(false)
    expect(files.length).toBeGreaterThan(0)

    const sources = await Promise.all(files.map((file) => fs.readFile(file.path, 'utf-8')))
    const combined = sources.join('\n')

    // The original bug emitted invalid syntax such as `.and(.nullable())`.
    expect(combined).not.toMatch(/\.and\(\s*\./)
    expect(combined).toContain('nullableStringSchema.nullable()')

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
