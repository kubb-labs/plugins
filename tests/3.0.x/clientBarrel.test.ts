import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { createKubb } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginBarrel } from '@kubb/plugin-barrel'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginTs } from '@kubb/plugin-ts'
import { Diagnostics, fsStorage } from 'kubb/kit'
import { describe, expect, test } from 'vitest'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const compiler = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin/tsc')

describe.each([
  { name: 'fetch', plugin: pluginFetch },
  { name: 'axios', plugin: pluginAxios },
])('$name public runtime exports', ({ name, plugin }) => {
  test.each([{ type: 'all' }, { type: 'named' }, { type: 'named', nested: true }] as const)('barrel %j', async (barrel) => {
    const output = await fs.mkdtemp(path.join(os.tmpdir(), `kubb-client-barrel-${name}-`))
    try {
      if (name === 'axios') {
        const axios = path.dirname(require.resolve('axios/package.json', { paths: [path.join(dirname, '../../packages/plugin-axios')] }))
        await fs.mkdir(path.join(output, 'node_modules'))
        await fs.symlink(axios, path.join(output, 'node_modules/axios'), 'junction')
      }

      const { files, diagnostics } = await createKubb({
        root: dirname,
        input: '../../schemas/3.0.x/petStore.yaml',
        output: { path: output, barrel },
        adapter: adapterOas({ validate: false, enums: 'root' }),
        parsers: [parserTs({ extension: { '.ts': '.ts' } })],
        reporters: [],
        storage: fsStorage(),
        plugins: [pluginBarrel(), pluginTs(), plugin()],
      }).safeBuild()
      expect(Diagnostics.hasError(diagnostics)).toBe(false)

      for (const file of files.filter((file) => file.baseName === 'index.ts')) {
        expect(await fs.readFile(file.path, 'utf8')).not.toMatch(/export .* from ['"].*\/core\.ts['"]/)
      }
      expect(await fs.readFile(path.join(output, '.kubb/core.ts'), 'utf8')).toContain('export class ResponseError')

      const result = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          '--input-type=module',
          '-e',
          `import assert from 'node:assert/strict'
import * as api from ${JSON.stringify(pathToFileURL(path.join(output, 'index.ts')).href)}
import * as client from ${JSON.stringify(pathToFileURL(path.join(output, '.kubb/client.ts')).href)}
assert.equal(typeof api.ResponseError, 'function')
assert.equal(typeof api.isResponseError, 'function')
assert.equal(api.ResponseError, client.ResponseError)
assert.equal(api.isResponseError, client.isResponseError)
const error = new api.ResponseError({ data: { message: 'invalid' }, status: 400, statusText: 'Bad Request', request: {}, response: {} })
assert.ok(error instanceof client.ResponseError)
assert.ok(api.ResponseError.is(error))
assert.ok(api.isResponseError(error))
assert.equal(error.status, 400)
assert.deepEqual(error.data, { message: 'invalid' })`,
        ],
        { encoding: 'utf8' },
      )
      expect(result.status, result.stderr).toBe(0)

      await fs.writeFile(
        path.join(output, 'consumer.ts'),
        `import type * as api from './index.ts'
import type * as client from './.kubb/client.ts'
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false
type Assert<T extends true> = T
export type Checks = [
  Assert<Equal<api.ResponseError['request'], client.NativeRequest>>,
  Assert<Equal<api.ResponseError['response'], client.NativeResponse>>,
  Assert<Equal<api.RequestConfig['options'], client.NativeOptions | undefined>>,
  Assert<Equal<api.ClientConfig['options'], client.NativeOptions | undefined>>,
  Assert<Equal<api.TransportResult['request'], client.NativeRequest>>,
  Assert<Equal<api.TransportResult['response'], client.NativeResponse>>,
  Assert<Equal<api.ClientInstance, client.ClientInstance>>,
  Assert<Equal<api.ResponseErrorOf<unknown>, client.ResponseErrorOf<unknown>>>
]
`,
      )
      await fs.writeFile(
        path.join(output, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            noEmit: true,
            strict: true,
            skipLibCheck: true,
            target: 'es2022',
            module: 'esnext',
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            types: [],
          },
          files: ['consumer.ts'],
        }),
      )
      const types = spawnSync(process.execPath, [compiler, '-p', path.join(output, 'tsconfig.json')], { encoding: 'utf8' })
      expect(types.status, types.stdout + types.stderr).toBe(0)
    } finally {
      await fs.rm(output, { recursive: true, force: true })
    }
  })
})
