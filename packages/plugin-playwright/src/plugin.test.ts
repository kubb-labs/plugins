import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pluginTs } from '@kubb/plugin-ts'
import { createKubb, defineConfig } from 'kubb'
import { Diagnostics } from 'kubb/kit'
import ts from 'typescript'
import { expect, onTestFinished, test, vi } from 'vitest'
import { format } from '#mocks'
import { pluginPlaywright } from './index.ts'

test('generates a GET helper with a required context and a typed native response', async () => {
  const root = await mkdtemp(fileURLToPath(new URL('../.test-', import.meta.url)))
  onTestFinished(() => rm(root, { recursive: true, force: true }))

  using kubb = createKubb(
    defineConfig({
      root,
      input: {
        openapi: '3.0.3',
        info: { title: 'Pets', version: '1.0.0' },
        paths: {
          '/pets': {
            get: {
              operationId: 'getPets',
              responses: {
                '200': {
                  description: 'Pets',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      output: { path: 'generated', defaultBanner: false, format: false, lint: false },
      plugins: [pluginTs(), pluginPlaywright()],
    }),
  )
  const result = await kubb.build()
  expect(Diagnostics.hasError(result.diagnostics)).toBe(false)

  const helperPath = join(root, 'generated/playwright/pwGetPets.ts')
  const source = await readFile(helperPath, 'utf8')
  expect(result.files.filter((file) => file.path.includes('/playwright/') && file.baseName !== 'index.ts').map((file) => file.baseName)).toStrictEqual([
    'pwGetPets.ts',
  ])
  expect(await format(source)).toMatchInlineSnapshot(`
    "import type { GetPetsResponse } from '../types/GetPets'
    import type { APIRequestContext, APIResponse } from '@playwright/test'

    export function pwGetPets({ request }: { request: APIRequestContext }): Promise<APIResponse<GetPetsResponse>> {
      return request.fetch<GetPetsResponse>('/pets', { method: 'GET' })
    }
    "
  `)

  const usagePath = join(root, 'usage.ts')
  await writeFile(
    usagePath,
    `import type { APIRequestContext, APIResponse } from '@playwright/test'
import type { GetPetsResponse } from './generated/types/GetPets'
import { pwGetPets } from './generated/playwright/pwGetPets'

declare const request: APIRequestContext
const response = await pwGetPets({ request })
const typedResponse: APIResponse<GetPetsResponse> = response
const pets = await response.json()
const names: Array<string> = pets.map(pet => pet.name)
// @ts-expect-error The context is required.
pwGetPets({})
// @ts-expect-error The argument is required.
pwGetPets()
// @ts-expect-error OpenAPI declares name as a string.
const invalid: number = pets[0]!.name
`,
  )
  const program = ts.createProgram([usagePath], {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true,
    types: [],
  })
  expect(ts.getPreEmitDiagnostics(program).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toStrictEqual([])

  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
  const { pwGetPets } = await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
  const response = { json: vi.fn() }
  const request = { fetch: vi.fn().mockResolvedValue(response) }
  expect(await pwGetPets({ request })).toBe(response)
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', { method: 'GET' })
  expect(response.json).not.toHaveBeenCalled()
})
