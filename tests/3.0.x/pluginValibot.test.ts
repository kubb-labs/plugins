import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { type Config, Diagnostics, type KubbHooks, fsStorage } from 'kubb/kit'
import { parserTs } from '@kubb/parser-ts'
import { pluginValibot } from '@kubb/plugin-valibot'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

type BuildConfig = Omit<Config, 'plugins' | 'reporters'> & { plugins: unknown }

const base = {
  root: __dirname,
  input: '../../schemas/3.0.x/petStore.yaml',
  adapter: adapterOas({ validate: false }),
  parsers: [parserTs()],
  storage: fsStorage(),
}

const configs: Array<{ name: string; config: BuildConfig }> = [
  {
    name: 'inferredIncludeByTag',
    config: {
      ...base,
      output: { path: './gen' },
      plugins: [pluginValibot({ inferred: true, include: [{ type: 'tag', pattern: 'store' }] })],
    },
  },
  {
    name: 'dateCoercionTypeGuards',
    config: {
      ...base,
      adapter: adapterOas({ validate: false, dateType: 'date' }),
      output: { path: './gen', barrel: false },
      plugins: [
        pluginValibot({
          output: { path: './valibot', barrel: false, mode: 'directory' },
          coercion: true,
          typeGuards: true,
          inferred: true,
          include: [{ type: 'tag', pattern: 'store' }],
        }),
      ],
    },
  },
  {
    name: 'groupByTag',
    config: {
      ...base,
      output: { path: './gen', barrel: false },
      plugins: [
        pluginValibot({
          output: { path: './valibot', barrel: false, mode: 'directory' },
          group: { type: 'tag' },
          include: [{ type: 'tag', pattern: 'pet' }],
        }),
      ],
    },
  },
]

describe(`plugin-valibot options ${version}`, () => {
  test.each(configs)('config testing with config as $name', async ({ name, config }) => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-${name}-${Date.now()}`)
    const output = path.join(tmpDir, name)
    const { files, diagnostics } = await createKubb(
      {
        ...config,
        output: {
          ...config.output,
          path: output,
        },
      } as Config,
      {
        hooks: new Hookable<KubbHooks>(),
      },
    ).safeBuild()

    expect(files.length).toBeGreaterThan(0)
    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    // A file the build stops writing has no content to compare, so the list of files is pinned too.
    const paths = files.map((file) => getRelativePath(output, file.path)).sort()
    await expect(`${paths.join('\n')}\n`).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginValibot', name, 'files.txt'))

    for (const file of files) {
      const fileContent = await fs.readFile(file.path, 'utf-8')
      await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginValibot', name, getRelativePath(output, file.path)))
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
