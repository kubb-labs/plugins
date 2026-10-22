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

async function generate(name: string, validator: NonNullable<Parameters<typeof pluginClient>[0]>['validator']) {
  const tmpDir = path.join(os.tmpdir(), `kubb-test-client-${name}-${Date.now()}`)
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
        pluginZod({ inferred: 'direction', output: { path: './zod', barrel: false } }),
        pluginClient({ importPath: '../api/client', output: { path: './clients', barrel: false }, validator }),
      ],
    } as Config,
    { hooks: new Hookable<KubbHooks>() },
  ).safeBuild()

  const putEvent = await fs.readFile(path.join(output, 'clients/putEvent.ts'), 'utf-8')
  await fs.rm(tmpDir, { recursive: true, force: true })

  return { files, diagnostics, putEvent }
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

  test('without params validation no headers validator helper is imported', async () => {
    const { diagnostics, putEvent } = await generate('no-params', { request: 'zod', response: 'zod' })

    expect(Diagnostics.hasError(diagnostics)).toBe(false)
    expect(putEvent).not.toContain('toHeadersStandardSchema')
    expect(putEvent).not.toContain('putEventHeadersSchema')
    expect(putEvent).toContain('request: putEventBodySchema')
  })
})
