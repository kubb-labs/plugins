import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginVueQuery } from '@kubb/plugin-vue-query'
import { type Config, Diagnostics, fsStorage, type KubbHooks } from 'kubb/kit'
import { describe, expect, test } from 'vitest'

const dirname = path.dirname(fileURLToPath(import.meta.url))

describe('event stream hooks', () => {
  test.each([
    { name: 'axios', clientPlugin: pluginAxios },
    { name: 'fetch', clientPlugin: pluginFetch },
  ])('skips streaming hooks and preserves $name clients and JSON hooks', async ({ clientPlugin }) => {
    const output = await fs.mkdtemp(path.join(dirname, '.event-stream-'))
    try {
      const { diagnostics } = await createKubb(
        {
          root: dirname,
          input: '../../schemas/3.0.x/eventStream.yaml',
          output: { path: output, barrel: false },
          adapter: adapterOas({ validate: false }),
          parsers: [parserTs()],
          reporters: [],
          storage: fsStorage(),
          plugins: [
            pluginTs({ output: { path: './types', barrel: false } }),
            clientPlugin({ output: { path: './clients', barrel: false } }),
            pluginReactQuery({
              output: { path: './react', barrel: false, mode: 'directory' },
              hooks: true,
              suspense: {},
              infinite: { queryParam: 'page', initialPageParam: 0 },
              customOptions: { importPath: './useCustomHookOptions.ts' },
            }),
            pluginVueQuery({ output: { path: './vue', barrel: false }, hooks: true, infinite: { queryParam: 'page', initialPageParam: 0 } }),
            pluginSwr({ output: { path: './swr', barrel: false } }),
          ],
        } as Config,
        { hooks: new Hookable<KubbHooks>() },
      ).safeBuild()
      expect(Diagnostics.hasError(diagnostics), JSON.stringify(diagnostics)).toBe(false)

      for (const operation of ['streamGet', 'streamPost']) {
        const client = await fs.readFile(path.join(output, 'clients', `${operation}.ts`), 'utf8')
        expect(client).toContain('EventStreamResult<')
      }

      for (const dir of ['react', 'vue', 'swr']) {
        const files = await fs.readdir(path.join(output, dir), { recursive: true })
        expect(files).toContain('useHealthGet.ts')
        expect(files.some((file) => /stream/i.test(file))).toBe(false)
        for (const file of files.filter((file) => file.endsWith('.ts'))) {
          const source = await fs.readFile(path.join(output, dir, file), 'utf8')
          expect(source).not.toMatch(/streamGet|streamPost|useStream/)
        }
      }
    } finally {
      await fs.rm(output, { recursive: true, force: true })
    }
  })
})
