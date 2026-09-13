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

const responses = {
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
}
const getPets = { operationId: 'getPets', responses }
const getPetById = {
  operationId: 'getPetById',
  parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
  responses,
}

async function generate({ paths = { '/pets': { get: getPets } }, baseURL }: { paths?: Record<string, unknown>; baseURL?: string } = {}) {
  const root = await mkdtemp(fileURLToPath(new URL('../.test-', import.meta.url)))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  using kubb = createKubb(
    defineConfig({
      root,
      input: {
        openapi: '3.0.3',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [{ url: 'https://ignored.example.com' }],
        paths,
      },
      output: { path: 'generated', defaultBanner: false, format: false, lint: false },
      plugins: [pluginTs(), pluginPlaywright(baseURL === undefined ? undefined : { baseURL })],
    }),
  )
  const result = await kubb.build()
  expect(Diagnostics.hasError(result.diagnostics)).toBe(false)
  const files = result.files.filter((file) => file.path.includes('/playwright/') && file.baseName !== 'index.ts').map((file) => file.baseName)
  return { root, files }
}

async function typecheck({ root, source }: { root: string; source: string }) {
  const usagePath = join(root, 'usage.ts')
  await writeFile(usagePath, source)
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
}

async function loadHelper(source: string) {
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
  return import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}

test('generates a GET helper with a required context and a typed native response', async () => {
  const { root, files } = await generate()
  const source = await readFile(join(root, 'generated/playwright/pwGetPets.ts'), 'utf8')
  expect(files).toStrictEqual(['pwGetPets.ts'])
  expect(await format(source)).toMatchInlineSnapshot(`
    "import type { GetPetsResponse } from '../types/GetPets'
    import type { APIRequestContext, APIResponse } from '@playwright/test'

    export function pwGetPets({ request }: { request: APIRequestContext }): Promise<APIResponse<GetPetsResponse>> {
      return request.fetch<GetPetsResponse>('/pets', { method: 'GET' })
    }
    "
  `)

  await typecheck({
    root,
    source: `import type { APIRequestContext, APIResponse } from '@playwright/test'
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
  })
  const { pwGetPets } = await loadHelper(source)
  const response = { json: vi.fn() }
  const request = { fetch: vi.fn().mockResolvedValue(response) }
  expect(await pwGetPets({ request })).toBe(response)
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', { method: 'GET' })
  expect(response.json).not.toHaveBeenCalled()
})

test('requires the OpenAPI path type and preserves the typed native response', async () => {
  const { root } = await generate({ paths: { '/pets/{petId}': { get: getPetById } } })
  const source = await readFile(join(root, 'generated/playwright/pwGetPetById.ts'), 'utf8')
  expect(await format(source)).toMatchInlineSnapshot(`
    "import type { GetPetByIdResponse, GetPetByIdPath } from '../types/GetPetById'
    import type { APIRequestContext, APIResponse } from '@playwright/test'

    export function pwGetPetById({ request, path }: { request: APIRequestContext; path: GetPetByIdPath }): Promise<APIResponse<GetPetByIdResponse>> {
      return request.fetch<GetPetByIdResponse>('/pets/' + encodeURIComponent(String(path['petId'])), { method: 'GET' })
    }
    "
  `)
  await typecheck({
    root,
    source: `
import type { APIRequestContext } from '@playwright/test'
import { pwGetPetById } from './generated/playwright/pwGetPetById'
declare const request: APIRequestContext
const response = await pwGetPetById({ request, path: { petId: '123' } })
const pets = await response.json()
const names: Array<string> = pets.map(pet => pet.name)
// @ts-expect-error The path group is required.
pwGetPetById({ request })
// @ts-expect-error The path parameter is required.
pwGetPetById({ request, path: {} })
// @ts-expect-error The path parameter must be a string.
pwGetPetById({ request, path: { petId: 123 } })
// @ts-expect-error The context is still required.
pwGetPetById({ path: { petId: '123' } })
// @ts-expect-error The JSON response stays typed.
const invalid: number = pets[0]!.name
`,
  })
  const { pwGetPetById } = await loadHelper(source)
  const response = { json: vi.fn() }
  const request = { fetch: vi.fn().mockResolvedValue(response) }
  expect(await pwGetPetById({ request, path: { petId: 'a/b' } })).toBe(response)
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets/a%2Fb', { method: 'GET' })
  expect(response.json).not.toHaveBeenCalled()
})

test('encodes multiple path values and keeps their OpenAPI property names', async () => {
  const { root } = await generate({
    paths: {
      '/owners/{ownerId}/pets/{pet-id}.json': {
        get: {
          ...getPets,
          parameters: [
            { name: 'ownerId', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'pet-id', in: 'path', required: true, schema: { type: 'string' } },
          ],
        },
      },
    },
  })
  const source = await readFile(join(root, 'generated/playwright/pwGetPets.ts'), 'utf8')
  await typecheck({
    root,
    source: `
import type { APIRequestContext } from '@playwright/test'
import { pwGetPets } from './generated/playwright/pwGetPets'
declare const request: APIRequestContext
pwGetPets({ request, path: { ownerId: 42, 'pet-id': '123' } })
// @ts-expect-error The owner ID must be a number.
pwGetPets({ request, path: { ownerId: '42', 'pet-id': '123' } })
// @ts-expect-error Both path parameters are required.
pwGetPets({ request, path: { ownerId: 42 } })
// @ts-expect-error OpenAPI property names are not renamed.
pwGetPets({ request, path: { ownerId: 42, petId: '123' } })
`,
  })
  const { pwGetPets } = await loadHelper(source)
  const request = { fetch: vi.fn() }
  await pwGetPets({ request, path: { ownerId: 42, 'pet-id': 'a/b ?#%&=+é🐾' } })
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/owners/42/pets/a%2Fb%20%3F%23%25%26%3D%2B%C3%A9%F0%9F%90%BE.json', { method: 'GET' })
})

test.each([
  { baseURL: undefined, expected: '/pets/a%2Fb' },
  { baseURL: '', expected: '/pets/a%2Fb' },
  { baseURL: 'https://api.example.com/v1', expected: 'https://api.example.com/v1/pets/a%2Fb' },
  { baseURL: 'https://api.example.com/v1/', expected: 'https://api.example.com/v1/pets/a%2Fb' },
])('joins baseURL $baseURL with the encoded path', async ({ baseURL, expected }) => {
  const { root } = await generate({ baseURL, paths: { '/pets/{petId}': { get: getPetById } } })
  const source = await readFile(join(root, 'generated/playwright/pwGetPetById.ts'), 'utf8')
  const { pwGetPetById } = await loadHelper(source)
  const request = { fetch: vi.fn() }
  await pwGetPetById({ request, path: { petId: 'a/b' } })
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith(expected, { method: 'GET' })
})

test('escapes literal URL text and unusual parameter names as TypeScript strings', async () => {
  const { root } = await generate({
    paths: {
      '/pets`/{pet"id}/$fixed': {
        get: {
          ...getPets,
          parameters: [{ name: 'pet"id', in: 'path', required: true, schema: { type: 'string' } }],
        },
      },
    },
  })
  const source = await readFile(join(root, 'generated/playwright/pwGetPets.ts'), 'utf8')
  await typecheck({
    root,
    source: `
import type { APIRequestContext } from '@playwright/test'
import { pwGetPets } from './generated/playwright/pwGetPets'
declare const request: APIRequestContext
pwGetPets({ request, path: { 'pet"id': '123' } })
`,
  })
  const { pwGetPets } = await loadHelper(source)
  const request = { fetch: vi.fn() }
  await pwGetPets({ request, path: { 'pet"id': 'a/b' } })
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets`/a%2Fb/$fixed', { method: 'GET' })
})

test.each([
  { name: 'non-GET', method: 'post', operation: {} },
  ...['query', 'header', 'cookie'].map((location) => ({
    name: location,
    method: 'get',
    operation: { parameters: [{ name: 'filter', in: location, schema: { type: 'string' } }] },
  })),
  { name: 'request body', method: 'get', operation: { requestBody: { content: { 'application/json': { schema: { type: 'string' } } } } } },
])('skips operations with $name outside this lot', async ({ method, operation }) => {
  const { files } = await generate({ paths: { '/pets': { [method]: { ...getPets, ...operation } } } })
  expect(files).toStrictEqual([])
})
