import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginVueQuery } from '@kubb/plugin-vue-query'
import { type Config, Diagnostics, fsStorage, type KubbHooks } from 'kubb/kit'
import { describe, expect, test } from 'vitest'

const dirname = path.dirname(fileURLToPath(import.meta.url))

describe('reserved operation names', () => {
  test.each([
    { name: 'axios', clientPlugin: pluginAxios },
    { name: 'fetch', clientPlugin: pluginFetch },
  ])('generates valid clients and hooks with $name', async ({ name, clientPlugin }) => {
    const output = await fs.mkdtemp(path.join(dirname, '.reserved-operations-'))
    try {
      const { diagnostics } = await createKubb(
        {
          root: dirname,
          input: '../../schemas/3.0.x/reservedOperations.yaml',
          output: { path: output, barrel: false },
          adapter: adapterOas({ validate: false }),
          parsers: [parserTs()],
          reporters: [],
          storage: fsStorage(),
          plugins: [
            pluginTs({ output: { path: './types', barrel: false } }),
            clientPlugin({ output: { path: './clients', barrel: false } }),
            pluginReactQuery({ output: { path: './react', barrel: false }, hooks: true }),
            pluginVueQuery({ output: { path: './vue', barrel: false }, hooks: true }),
            pluginSwr({ output: { path: './swr', barrel: false } }),
            pluginCypress({ output: { path: './cypress', barrel: false } }),
          ],
        } as Config,
        { hooks: new Hookable<KubbHooks>() },
      ).safeBuild()
      expect(Diagnostics.hasError(diagnostics)).toBe(false)

      for (const name of ['export', 'import', 'await']) {
        const client = await fs.readFile(path.join(output, 'clients', `${name}.ts`), 'utf8')
        expect(client).toContain(`function _${name}<`)
        const hookName = `use${name[0]!.toUpperCase()}${name.slice(1)}`
        for (const dir of ['react', 'vue', 'swr']) {
          const hook = await fs.readFile(path.join(output, dir, `${hookName}.ts`), 'utf8')
          const clientName = dir === 'swr' ? 'clientOperation' : `_${name}`
          expect(hook).toContain(`import { _${name}${dir === 'swr' ? ' as clientOperation' : ''} }`)
          expect(hook).toContain(`${clientName}(`)
        }
      }

      const files = (await fs.readdir(output, { recursive: true })).filter((file) => file.endsWith('.ts')).map((file) => path.join(output, file))
      const compiler = path.join(path.dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin/tsc')
      const flags = ['--ignoreConfig', '--noEmit', '--skipLibCheck', '--module', 'preserve', '--moduleResolution', 'bundler', '--target', 'es2022']
      if (name === 'fetch') {
        execFileSync(process.execPath, [compiler, ...flags, '--strict', ...files.filter((file) => file.startsWith(path.join(output, 'clients')))], {
          stdio: 'inherit',
        })
      }
      // Syntax checking covers Axios and hooks whose runtime dependencies are not installed in this test workspace.
      execFileSync(process.execPath, [compiler, ...flags, '--noCheck', ...files], { stdio: 'inherit' })
    } finally {
      await fs.rm(output, { recursive: true, force: true })
    }
  })
})
