import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { type Config, Diagnostics, fsStorage, type KubbHooks } from 'kubb/kit'
import { pluginClient } from '@kubb/plugin-client'
import { parserTs } from '@kubb/parser-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

type ClientOptions = NonNullable<Parameters<typeof pluginClient>[0]>

async function generate(name: string, validator: ClientOptions['validator'], runtime?: ClientOptions['runtime']) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `kubb-test-client-${name}-`))
  const output = path.join(tmpDir, 'gen')
  const { files, diagnostics } = await createKubb(
    {
      root: __dirname,
      input: '../../schemas/3.0.x/codecParams.yaml',
      output: { path: output, barrel: false },
      adapter: adapterOas({ validate: false, dateType: 'date' }),
      parsers: [parserTs()],
      reporters: [],
      storage: fsStorage(),
      plugins: [
        pluginZod({ inferred: 'codec', output: { path: './zod', barrel: false } }),
        pluginClient({ importPath: '../api/client', output: { path: './clients', barrel: false }, validator, runtime }),
      ],
    } as Config,
    { hooks: new Hookable<KubbHooks>() },
  ).safeBuild()

  const putEvent = await fs.readFile(path.join(output, 'clients/putEvent.ts'), 'utf-8')
  const runtimeClient = await fs.readFile(path.join(output, '.kubb/client.ts'), 'utf-8').catch(() => undefined)
  const runtimeConfig = await fs.readFile(path.join(output, '.kubb/config.ts'), 'utf-8').catch(() => undefined)
  await fs.rm(tmpDir, { recursive: true, force: true })

  return { files, diagnostics, putEvent, runtimeClient, runtimeConfig }
}

describe(`plugin-client ${version}`, () => {
  // plugin-client ships no `.kubb/` runtime: the module at `importPath` exports every helper a generated
  // operation uses, the case-insensitive headers validator included.
  test("params: 'zod' imports the headers validator helper from the custom client module", async () => {
    const { files, diagnostics, putEvent } = await generate('params', { request: 'zod', params: 'zod', response: 'zod' })

    expect(Diagnostics.hasError(diagnostics)).toBe(false)
    expect(putEvent).toContain('path: putEventPathSchema')
    expect(putEvent).toContain('query: putEventQuerySchema')
    expect(putEvent).toContain('headers: toHeadersStandardSchema(putEventHeadersSchema, putEventHeadersSchema.shape)')
    expect(putEvent).toMatch(/import \{[^}]*\btoHeadersStandardSchema\b[^}]*\} from '\.\.\/api\/client'/)
    expect(putEvent).not.toContain('.kubb')
    expect(files.some((file) => file.path.split(path.sep).includes('.kubb'))).toBe(false)
  })

  test("runtime: 'fetch' writes the .kubb/ runtime with the fetch client, while operations still import from importPath", async () => {
    const { diagnostics, putEvent, runtimeClient, runtimeConfig } = await generate('runtime', false, 'fetch')

    expect(Diagnostics.hasError(diagnostics)).toBe(false)
    expect(putEvent).toMatch(/from '\.\.\/api\/client'/)
    expect(putEvent).not.toContain('.kubb')
    expect(runtimeClient).toContain('globalThis.fetch')
    expect(runtimeConfig).toContain('export const defaultConfig')
  })

  test('runtime fails with KUBB_MISSING_DEPENDENCY when the transport package is not installed', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kubb-test-client-missing-'))
    const { diagnostics } = await createKubb(
      {
        root,
        input: path.resolve(__dirname, '../../schemas/3.0.x/codecParams.yaml'),
        output: { path: path.join(root, 'gen'), barrel: false },
        adapter: adapterOas({ validate: false }),
        parsers: [parserTs()],
        reporters: [],
        storage: fsStorage(),
        plugins: [
          pluginClient({
            importPath: '../api/client',
            // @ts-expect-error Vitest resolves workspace packages from any folder, so use a transport name no package has.
            runtime: 'missing',
          }),
        ],
      } as Config,
      { hooks: new Hookable<KubbHooks>() },
    ).safeBuild()
    await fs.rm(root, { recursive: true, force: true })

    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'KUBB_MISSING_DEPENDENCY', message: expect.stringContaining('"@kubb/plugin-missing"') }))
  })
})
