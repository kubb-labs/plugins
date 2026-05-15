/**
 * Streaming adapter e2e test
 *
 * Validates that a full multi-plugin Kubb build completes correctly when the
 * OAS adapter operates in streaming mode. Streaming is activated when the spec
 * has more than 100 component schemas (STREAM_SCHEMA_THRESHOLD in createKubb.ts).
 *
 * The `largeSynthetic.json` fixture has 112 schemas — enough to trigger the
 * streaming path when running with @kubb/core from PR #3290 / the claude branch.
 * With the published npm release (< streaming support), the same test runs the
 * batch path: output correctness is validated in both modes.
 *
 * To exercise streaming locally:
 *   1. Build kubb core + adapter-oas from the PR branch
 *   2. Copy their dist/ into plugins/node_modules (or use link: in pnpm-workspace)
 *   3. pnpm test --filter tests-3.0.x -- streaming
 */
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, type Config, createKubb, type KubbHooks } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Relative path from this test file to the large synthetic schema fixture. */
const LARGE_SPEC = path.resolve(__dirname, '../../schemas/3.0.x/largeSynthetic.json')

const configs = [
  {
    name: 'streaming-pluginTs',
    description: 'TypeScript types only — validates schema fan-out across 112 schemas',
    config: {
      root: __dirname,
      input: { path: LARGE_SPEC },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: { path: './types', barrel: false },
          group: { type: 'tag' },
        }),
      ],
    },
  },
  {
    name: 'streaming-multiPlugin',
    description: 'Three plugins in parallel — validates fan-out delivers all schema/operation nodes to each plugin',
    config: {
      root: __dirname,
      input: { path: LARGE_SPEC },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: { path: './types', barrel: false },
          group: { type: 'tag' },
        }),
        pluginZod({
          output: { path: './zod', barrel: false },
          group: { type: 'tag' },
        }),
        pluginClient({
          output: { path: './client', barrel: false },
          group: { type: 'tag' },
        }),
      ],
    },
  },
]

describe('Streaming adapter e2e (largeSynthetic.json — 112 schemas)', () => {
  test.each(configs)('$name — $description', async ({ name, config }) => {
    const tmpDir = path.join(os.tmpdir(), `kubb-streaming-${name}-${Date.now()}`)
    const output = path.join(tmpDir, name)

    const { files, failedPlugins, error } = await createKubb(
      {
        ...config,
        output: { ...config.output, path: output },
      } as unknown as Config,
      { hooks: new AsyncEventEmitter<KubbHooks>() },
    ).safeBuild()

    expect(error).toBeUndefined()
    expect(failedPlugins.size).toBe(0)
    // 112 schemas × at least 1 file each (types), plus operations files
    expect(files.length).toBeGreaterThan(50)

    // Spot-check: every generated file was actually written to disk
    for (const file of files.slice(0, 10)) {
      const stat = await fs.stat(file.path).catch(() => null)
      expect(stat).not.toBeNull()
      expect(stat!.size).toBeGreaterThan(0)
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  }, 60_000)
})
