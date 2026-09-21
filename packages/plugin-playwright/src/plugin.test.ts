import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
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
const petBody = { type: 'object', required: ['name'], properties: { name: { type: 'string' } } }
const addPet = {
  operationId: 'addPet',
  requestBody: { required: true, content: { 'application/json': { schema: petBody } } },
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

async function loadHelper({ root, name }: { root: string; name: string }) {
  return import(/* @vite-ignore */ pathToFileURL(join(root, 'generated/playwright', `${name}.ts`)).href)
}

test('generates a GET helper with a required context and a typed native response', async () => {
  const { root, files } = await generate()
  const source = await readFile(join(root, 'generated/playwright/pwGetPets.ts'), 'utf8')
  expect(files).toStrictEqual(['pwGetPets.ts'])
  expect(await format(source)).toMatchInlineSnapshot(`
    "import type { RequestConfig } from '../.kubb/playwright'
    import type { GetPetsResponse } from '../types/GetPets'
    import type { APIRequestContext, APIResponse } from '@playwright/test'
    import { playwrightRequest } from '../.kubb/playwright'

    export function pwGetPets({ request, config }: { request: APIRequestContext; config?: RequestConfig }): Promise<APIResponse<GetPetsResponse>> {
      return playwrightRequest<GetPetsResponse>({ request, config, method: 'GET', url: '/pets' })
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
  const { pwGetPets } = await loadHelper({ root, name: 'pwGetPets' })
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
    "import type { RequestConfig } from '../.kubb/playwright'
    import type { GetPetByIdResponse, GetPetByIdPath } from '../types/GetPetById'
    import type { APIRequestContext, APIResponse } from '@playwright/test'
    import { playwrightRequest } from '../.kubb/playwright'

    export function pwGetPetById({
      request,
      path,
      config,
    }: {
      request: APIRequestContext
      path: GetPetByIdPath
      config?: RequestConfig
    }): Promise<APIResponse<GetPetByIdResponse>> {
      return playwrightRequest<GetPetByIdResponse>({ request, path, config, method: 'GET', url: '/pets/{petId}' })
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
  const { pwGetPetById } = await loadHelper({ root, name: 'pwGetPetById' })
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
  const { pwGetPets } = await loadHelper({ root, name: 'pwGetPets' })
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
  const { pwGetPetById } = await loadHelper({ root, name: 'pwGetPetById' })
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
  await typecheck({
    root,
    source: `
import type { APIRequestContext } from '@playwright/test'
import { pwGetPets } from './generated/playwright/pwGetPets'
declare const request: APIRequestContext
pwGetPets({ request, path: { 'pet"id': '123' } })
`,
  })
  const { pwGetPets } = await loadHelper({ root, name: 'pwGetPets' })
  const request = { fetch: vi.fn() }
  await pwGetPets({ request, path: { 'pet"id': 'a/b' } })
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets`/a%2Fb/$fixed', { method: 'GET' })
})

test.each([
  { queryRequired: false, headerRequired: false },
  { queryRequired: true, headerRequired: false },
  { queryRequired: false, headerRequired: true },
  { queryRequired: true, headerRequired: true },
])('respects required groups: query=$queryRequired, headers=$headerRequired', async ({ queryRequired, headerRequired }) => {
  const { root } = await generate({
    paths: {
      '/pets': {
        get: {
          ...getPets,
          parameters: [
            { name: 'status', in: 'query', required: queryRequired, schema: { type: 'array', items: { type: 'string', enum: ['available', 'pending'] } } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'x-limit', in: 'header', required: headerRequired, schema: { type: 'integer' } },
            { name: 'x-label', in: 'header', schema: { type: 'string' } },
          ],
        },
      },
    },
  })
  await typecheck({
    root,
    source: `
import type { APIRequestContext } from '@playwright/test'
import { pwGetPets } from './generated/playwright/pwGetPets'
declare const request: APIRequestContext
const response = await pwGetPets({ request, query: { status: ['available', 'pending'] }, headers: { 'x-limit': 0 } })
const pets = await response.json()
const names: Array<string> = pets.map(pet => pet.name)
${queryRequired ? '// @ts-expect-error The query group is required.' : ''}
pwGetPets({ request, headers: { 'x-limit': 1 } })
${queryRequired ? '// @ts-expect-error The status parameter is required.' : ''}
pwGetPets({ request, query: {}, headers: { 'x-limit': 1 } })
${headerRequired ? '// @ts-expect-error The headers group is required.' : ''}
pwGetPets({ request, query: { status: [] } })
${headerRequired ? '// @ts-expect-error The x-limit header is required.' : ''}
pwGetPets({ request, query: { status: [] }, headers: {} })
// @ts-expect-error Query array items must match the OpenAPI enum.
pwGetPets({ request, query: { status: ['invalid'] }, headers: { 'x-limit': 1 } })
// @ts-expect-error Header values retain their OpenAPI types before serialization.
pwGetPets({ request, query: { status: [] }, headers: { 'x-limit': '1' } })
// @ts-expect-error Optional query members retain their OpenAPI types.
pwGetPets({ request, query: { status: [], limit: '1' }, headers: { 'x-limit': 1 } })
// @ts-expect-error The request context is always required.
pwGetPets({ query: { status: [] }, headers: { 'x-limit': 1 } })
// @ts-expect-error The native JSON response remains typed.
const invalid: number = pets[0]!.name
`,
  })
  const { pwGetPets } = await loadHelper({ root, name: 'pwGetPets' })
  const request = { fetch: vi.fn() }
  await pwGetPets({
    request,
    ...(queryRequired ? { query: { status: ['available'] } } : {}),
    ...(headerRequired ? { headers: { 'x-limit': 0 } } : {}),
  })
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', {
    method: 'GET',
    params: new URLSearchParams(queryRequired ? 'status=available' : ''),
    headers: headerRequired ? { 'x-limit': '0' } : {},
  })
})

test('serializes query arrays as repeated keys and omits nullish values', async () => {
  const { root } = await generate({
    baseURL: 'https://api.example.com/v1/',
    paths: {
      '/pets/{petId}': {
        get: {
          ...getPetById,
          parameters: [
            ...getPetById.parameters,
            { name: 'filter[name][]', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
            { name: 'offset', in: 'query', schema: { type: 'integer' } },
            { name: 'active', in: 'query', schema: { type: 'boolean' } },
            { name: 'empty', in: 'query', schema: { type: 'string' } },
            { name: 'missing', in: 'query', schema: { type: 'string' } },
            { name: 'nullable', in: 'query', schema: { type: 'string', nullable: true } },
            { name: 'tags', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
          ],
        },
      },
    },
  })
  await typecheck({
    root,
    source: `
import type { APIRequestContext } from '@playwright/test'
import { pwGetPetById } from './generated/playwright/pwGetPetById'
declare const request: APIRequestContext
pwGetPetById({ request, path: { petId: 'a/b' }, query: { 'filter[name][]': ['a/b'], offset: 0, active: false, empty: '', missing: undefined, nullable: null, tags: [] } })
// @ts-expect-error The query-only operation does not declare headers.
pwGetPetById({ request, path: { petId: 'a/b' }, headers: {} })
`,
  })
  const { pwGetPetById } = await loadHelper({ root, name: 'pwGetPetById' })
  const query = {
    'filter[name][]': ['a/b', ' ?#%&=+é🐾'],
    offset: 0,
    active: false,
    empty: '',
    missing: undefined,
    nullable: null,
    tags: [],
  }
  const response = { json: vi.fn() }
  const request = { fetch: vi.fn().mockResolvedValue(response) }
  expect(await pwGetPetById({ request, path: { petId: 'a/b' }, query })).toBe(response)
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('https://api.example.com/v1/pets/a%2Fb', {
    method: 'GET',
    params: new URLSearchParams([
      ['filter[name][]', 'a/b'],
      ['filter[name][]', ' ?#%&=+é🐾'],
      ['offset', '0'],
      ['active', 'false'],
      ['empty', ''],
    ]),
  })
  expect(request.fetch.mock.calls[0]![1].params.toString()).toBe(
    'filter%5Bname%5D%5B%5D=a%2Fb&filter%5Bname%5D%5B%5D=+%3F%23%25%26%3D%2B%C3%A9%F0%9F%90%BE&offset=0&active=false&empty=',
  )
  expect(response.json).not.toHaveBeenCalled()
})

test('preserves header names, stringifies values, and omits nullish values', async () => {
  const { root } = await generate({
    paths: {
      '/pets': {
        get: {
          ...getPets,
          parameters: [
            { name: 'X-Request-ID', in: 'header', schema: { type: 'string' } },
            { name: 'x-count', in: 'header', schema: { type: 'integer' } },
            { name: 'x-active', in: 'header', schema: { type: 'boolean' } },
            { name: 'x-empty', in: 'header', schema: { type: 'string' } },
            { name: 'x-missing', in: 'header', schema: { type: 'string' } },
            { name: 'x-nullable', in: 'header', schema: { type: 'string', nullable: true } },
          ],
        },
      },
    },
  })
  await typecheck({
    root,
    source: `
import type { APIRequestContext } from '@playwright/test'
import { pwGetPets } from './generated/playwright/pwGetPets'
declare const request: APIRequestContext
pwGetPets({ request, headers: { 'X-Request-ID': '123', 'x-count': 0, 'x-active': false, 'x-empty': '', 'x-missing': undefined, 'x-nullable': null } })
// @ts-expect-error OpenAPI header names are not renamed.
pwGetPets({ request, headers: { xRequestId: '123' } })
// @ts-expect-error The headers-only operation does not declare query parameters.
pwGetPets({ request, query: {} })
`,
  })
  const { pwGetPets } = await loadHelper({ root, name: 'pwGetPets' })
  const headers = { 'X-Request-ID': '123', 'x-count': 0, 'x-active': false, 'x-empty': '', 'x-missing': undefined, 'x-nullable': null }
  const request = { fetch: vi.fn() }
  await pwGetPets({ request, headers })
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', {
    method: 'GET',
    headers: { 'X-Request-ID': '123', 'x-count': '0', 'x-active': 'false', 'x-empty': '' },
  })
})

test.each(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'])('fixes the %s method and forwards native config', async (method) => {
  const { root } = await generate({ paths: { '/pets': { [method]: getPets } } })
  const { pwGetPets } = await loadHelper({ root, name: 'pwGetPets' })
  const request = { fetch: vi.fn() }
  await pwGetPets({ request, config: { method: 'WRONG', timeout: 0, failOnStatusCode: false, maxRetries: undefined } })
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', { method: method.toUpperCase(), timeout: 0, failOnStatusCode: false })
})

test.each(
  ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'].flatMap((contentType) =>
    [true, false].map((required) => ({ contentType, required })),
  ),
)('types $contentType bodies with required=$required and native config', async ({ contentType, required }) => {
  const { root } = await generate({ paths: { '/pets': { post: { ...addPet, requestBody: { required, content: { [contentType]: { schema: petBody } } } } } } })
  await typecheck({
    root,
    source: `
import type { APIRequestContext } from '@playwright/test'
import type { RequestConfig } from './generated/.kubb/playwright'
import { pwAddPet } from './generated/playwright/pwAddPet'
declare const request: APIRequestContext
const config: RequestConfig = { timeout: 0, failOnStatusCode: false, maxRetries: 1, signal: new AbortController().signal }
const response = await pwAddPet({ request, body: { name: 'Rex' }, config })
const names: string[] = (await response.json()).map(pet => pet.name)
pwAddPet({ request, body: { name: 'Rex' }, config: { data: 'raw', params: new URLSearchParams('tag=a&tag=b'), headers: { 'x-id': '123' } } })
pwAddPet({ request, body: { name: 'Rex' }, config: { form: { name: 'Rex' } } })
pwAddPet({ request, body: { name: 'Rex' }, config: { multipart: new FormData() } })
${required ? '// @ts-expect-error The OpenAPI body is required.' : ''}
pwAddPet({ request })
${required ? '// @ts-expect-error Native data does not make the OpenAPI body optional.' : ''}
pwAddPet({ request, config: { data: 'raw' } })
// @ts-expect-error The body must match the generated type.
pwAddPet({ request, body: { name: 42 } })
// @ts-expect-error The method belongs to the operation.
pwAddPet({ request, body: { name: 'Rex' }, config: { method: 'PUT' } })
// @ts-expect-error Native timeout is numeric.
pwAddPet({ request, body: { name: 'Rex' }, config: { timeout: '5000' } })
// @ts-expect-error Native headers require strings.
pwAddPet({ request, body: { name: 'Rex' }, config: { headers: { 'x-id': 123 } } })
`,
  })
  const { pwAddPet } = await loadHelper({ root, name: 'pwAddPet' })
  const request = { fetch: vi.fn() }
  await pwAddPet({ request, ...(required ? { body: { name: 'Rex' } } : {}) })
  if (required && contentType !== 'application/json') {
    const mode = contentType === 'multipart/form-data' ? 'multipart' : 'form'
    expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', { method: 'POST', [mode]: expect.any(FormData) })
    expect([...request.fetch.mock.calls[0]![1][mode].entries()]).toStrictEqual([['name', 'Rex']])
  } else {
    expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', {
      method: 'POST',
      ...(required ? { data: '{"name":"Rex"}', headers: { 'Content-Type': 'application/json' } } : {}),
    })
  }
})

test.each([
  { body: { name: 'Rex' }, data: '{"name":"Rex"}' },
  { body: ['Rex'], data: '["Rex"]' },
  { body: 'Rex', data: '"Rex"' },
  { body: '', data: '""' },
  { body: 0, data: '0' },
  { body: false, data: 'false' },
  { body: null, data: 'null' },
])('encodes JSON body $body as $data', async ({ body, data }) => {
  const { root } = await generate({
    paths: { '/pets': { post: { ...addPet, requestBody: { content: { 'application/json': { schema: {} } } } } } },
  })
  const { pwAddPet } = await loadHelper({ root, name: 'pwAddPet' })
  const request = { fetch: vi.fn() }
  await pwAddPet({ request, body })
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', { method: 'POST', data, headers: { 'Content-Type': 'application/json' } })
})

test('uses the first JSON media type and respects an explicit Content-Type', async () => {
  const { root } = await generate({
    paths: {
      '/pets': {
        post: {
          ...addPet,
          requestBody: {
            content: {
              'application/vnd.pet+json; charset=utf-8': { schema: petBody },
              'application/json': { schema: petBody },
            },
          },
          parameters: [{ name: 'x-id', in: 'header', schema: { type: 'string' } }],
        },
      },
    },
  })
  const { pwAddPet } = await loadHelper({ root, name: 'pwAddPet' })
  const request = { fetch: vi.fn() }
  await pwAddPet({ request, body: { name: 'Rex' }, headers: { 'x-id': '123' } })
  expect(request.fetch).toHaveBeenLastCalledWith('/pets', {
    method: 'POST',
    data: '{"name":"Rex"}',
    headers: { 'x-id': '123', 'Content-Type': 'application/vnd.pet+json; charset=utf-8' },
  })
  await pwAddPet({ request, body: { name: 'Rex' }, headers: { 'x-id': '123' }, config: { headers: { 'cOnTeNt-TyPe': 'application/custom+json' } } })
  expect(request.fetch).toHaveBeenLastCalledWith('/pets', {
    method: 'POST',
    data: '{"name":"Rex"}',
    headers: { 'cOnTeNt-TyPe': 'application/custom+json' },
  })
})

test('replaces query and headers completely and ignores undefined overrides', async () => {
  const { root } = await generate({
    paths: {
      '/pets': {
        get: {
          ...getPets,
          parameters: [
            { name: 'tag', in: 'query', schema: { type: 'string' } },
            { name: 'x-id', in: 'header', schema: { type: 'string' } },
          ],
        },
      },
    },
  })
  const { pwGetPets } = await loadHelper({ root, name: 'pwGetPets' })
  const request = { fetch: vi.fn() }
  const args = { request, query: { tag: 'generated' }, headers: { 'x-id': 'generated' } }
  await pwGetPets({ ...args, config: { params: 'tag=a&tag=b', headers: { 'x-other': 'native' } } })
  expect(request.fetch).toHaveBeenLastCalledWith('/pets', { method: 'GET', params: 'tag=a&tag=b', headers: { 'x-other': 'native' } })
  await pwGetPets({ ...args, config: { params: '', headers: {} } })
  expect(request.fetch).toHaveBeenLastCalledWith('/pets', { method: 'GET', params: '', headers: {} })
  await pwGetPets({ ...args, config: { params: undefined, headers: undefined } })
  expect(request.fetch).toHaveBeenLastCalledWith('/pets', { method: 'GET', params: new URLSearchParams('tag=generated'), headers: { 'x-id': 'generated' } })
})

test.each([
  { mode: 'empty data', config: { data: '' } },
  { mode: 'binary data', config: { data: Buffer.from('raw') } },
  { mode: 'form', config: { form: { name: 'Rex' } } },
  { mode: 'multipart', config: { multipart: new FormData() } },
])('replaces generated JSON with native $mode', async ({ config }) => {
  const { root } = await generate({ paths: { '/pets': { post: addPet } } })
  const { pwAddPet } = await loadHelper({ root, name: 'pwAddPet' })
  const request = { fetch: vi.fn() }
  await pwAddPet({ request, body: { name: 'Rex' }, config })
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', { method: 'POST', ...config })
})

test('keeps generated JSON when native body overrides are undefined', async () => {
  const { root } = await generate({ paths: { '/pets': { post: addPet } } })
  const { pwAddPet } = await loadHelper({ root, name: 'pwAddPet' })
  const request = { fetch: vi.fn() }
  await pwAddPet({ request, body: { name: 'Rex' }, config: { data: undefined, form: undefined, multipart: undefined, headers: {} } })
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', {
    method: 'POST',
    data: '{"name":"Rex"}',
    headers: { 'Content-Type': 'application/json' },
  })
})

test('passes conflicting native body modes to Playwright and propagates its rejection', async () => {
  const { root } = await generate({ paths: { '/pets': { post: addPet } } })
  const { pwAddPet } = await loadHelper({ root, name: 'pwAddPet' })
  const error = new Error('Only one body mode is allowed')
  const request = { fetch: vi.fn().mockRejectedValue(error) }
  const config = { data: 'raw', form: { name: 'Rex' } }
  await expect(pwAddPet({ request, body: { name: 'Rex' }, config })).rejects.toBe(error)
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', { method: 'POST', ...config })
})

test.each([
  { contentType: 'application/x-www-form-urlencoded; charset=utf-8', mode: 'form' },
  { contentType: 'multipart/form-data', mode: 'multipart' },
])('sends $mode fields using the first declared content type', async ({ contentType, mode }) => {
  const schema = {
    type: 'object',
    properties: {
      'pet-name': { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      count: { type: 'integer' },
      active: { type: 'boolean' },
      absent: { type: 'string', nullable: true },
      missing: { type: 'string' },
    },
  }
  const { root } = await generate({
    paths: { '/pets': { post: { ...addPet, requestBody: { content: { [contentType]: { schema }, 'application/json': { schema } } } } } },
  })
  const { pwAddPet } = await loadHelper({ root, name: 'pwAddPet' })
  const request = { fetch: vi.fn() }
  await pwAddPet({
    request,
    body: { 'pet-name': '', tags: ['a&b', 'é'], count: 0, active: false, absent: null },
    config: { data: undefined, form: undefined, multipart: undefined },
  })
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', { method: 'POST', [mode]: expect.any(FormData) })
  expect([...request.fetch.mock.calls[0]![1][mode].entries()]).toStrictEqual([
    ['pet-name', ''],
    ['tags', 'a&b'],
    ['tags', 'é'],
    ['count', '0'],
    ['active', 'false'],
  ])

  const body = { metadata: { nested: true } }
  expect(() => pwAddPet({ request, body })).toThrow('Use config.form or config.multipart')
  for (const config of [{ data: '' }, { form: { metadata: '{"nested":true}' } }, { multipart: new FormData() }, { data: 'raw', form: {} }]) {
    await pwAddPet({ request, body, config: { ...config, headers: { 'Content-Type': 'custom/type' } } })
    expect(request.fetch).toHaveBeenLastCalledWith('/pets', { method: 'POST', ...config, headers: { 'Content-Type': 'custom/type' } })
  }
})

test('types binary multipart fields as Blob and passes files to Playwright', async () => {
  const schema = { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' }, description: { type: 'string' } } }
  const { root } = await generate({
    paths: { '/pets': { post: { ...addPet, requestBody: { required: true, content: { 'multipart/form-data': { schema } } } } } },
  })
  await typecheck({
    root,
    source: `
import type { APIRequestContext } from '@playwright/test'
import { pwAddPet } from './generated/playwright/pwAddPet'
declare const request: APIRequestContext
pwAddPet({ request, body: { file: new Blob(['photo']) } })
pwAddPet({ request, body: { file: new File(['photo'], 'pet.txt') } })
// @ts-expect-error The binary field requires a Blob.
pwAddPet({ request, body: { file: 'photo' } })
// @ts-expect-error The file field is required.
pwAddPet({ request, body: {} })
`,
  })
  const { pwAddPet } = await loadHelper({ root, name: 'pwAddPet' })
  const request = { fetch: vi.fn() }
  const file = new File(['photo'], 'pet.txt', { type: 'text/plain' })
  await pwAddPet({ request, body: { file, description: 'Rex' } })
  expect(request.fetch).toHaveBeenCalledExactlyOnceWith('/pets', { method: 'POST', multipart: expect.any(FormData) })
  const multipart: FormData = request.fetch.mock.calls[0]![1].multipart
  expect(multipart.get('description')).toBe('Rex')
  expect(multipart.get('file')).toBe(file)
})
