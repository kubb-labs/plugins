import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { type Config, Diagnostics, fsStorage, type KubbHooks } from 'kubb/kit'
import { pluginFetch } from '@kubb/plugin-fetch'
import { parserTs } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const tscFlags =
  '--ignoreConfig --noEmit --strict --skipLibCheck --allowImportingTsExtensions --module preserve --moduleResolution bundler --target es2022 --lib es2022,dom'.split(
    ' ',
  )

/**
 * Generates `train-travel.yaml`, which has security schemes and response headers, with `importPath` pointing at a
 * binding that only re-exports the `.kubb/` runtime, then typechecks every generated client against it.
 */
async function generate(name: string, sdk: NonNullable<Parameters<typeof pluginFetch>[0]>['sdk']) {
  const output = path.join(await fs.mkdtemp(path.join(os.tmpdir(), `kubb-test-fetch-import-path-${name}-`)), 'gen')
  const { diagnostics } = await createKubb(
    {
      root: __dirname,
      input: '../../schemas/3.0.x/train-travel.yaml',
      output: { path: output, barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs()],
      reporters: [],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFetch({ output: { path: './clients', barrel: false }, importPath: '../api/client', sdk }),
      ],
    } as Config,
    { hooks: new Hookable<KubbHooks>() },
  ).safeBuild()

  await fs.mkdir(path.join(output, 'api'))
  await fs.writeFile(path.join(output, 'api/client.ts'), "export * from '../.kubb/client.ts'\n")
  const clientFiles = (await fs.readdir(path.join(output, 'clients'))).map((file) => path.join(output, 'clients', file))
  const clients = await Promise.all(clientFiles.map((file) => fs.readFile(file, 'utf-8')))
  const typecheck = () => execFileSync(path.join(__dirname, 'node_modules/.bin/tsc'), [...tscFlags, ...clientFiles], { encoding: 'utf8' })
  const cleanup = () => fs.rm(path.dirname(output), { recursive: true, force: true })

  return { diagnostics, clients, runtime: await fs.readdir(path.join(output, '.kubb')), typecheck, cleanup }
}

describe('plugin-fetch importPath 3.0.x', () => {
  test.each([
    { name: 'functions', sdk: undefined },
    { name: 'sdk', sdk: {} },
  ])('$name: imports from importPath, keeps securitySchemes and typed headers, and writes the .kubb/ runtime', async ({ name, sdk }) => {
    const { diagnostics, clients, runtime, typecheck, cleanup } = await generate(name, sdk)

    try {
      expect(Diagnostics.hasError(diagnostics)).toBe(false)
      expect(runtime).toEqual(expect.arrayContaining(['client.ts', 'config.ts', 'core.ts']))
      expect(clients.every((file) => file.includes("from '../api/client'") && !file.includes('.kubb'))).toBe(true)
      expect(clients.some((file) => /import \{[^}]*\bsecuritySchemes\b[^}]*\} from '\.\.\/api\/client'/.test(file))).toBe(true)
      expect(clients.some((file) => file.includes('RequestResultWithHeaders'))).toBe(true)
      expect(typecheck).not.toThrow()
    } finally {
      await cleanup()
    }
  })
})
