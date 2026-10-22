import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { type Config, Diagnostics, fsStorage, type KubbHooks } from 'kubb/kit'
import { pluginFetch } from '@kubb/plugin-fetch'
import { parserTs } from '@kubb/parser-ts'
import { type PrinterZodNodes, pluginZod } from '@kubb/plugin-zod'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type ResolvedRequest = { url: string; headers: Record<string, string>; body?: unknown }
type ValidationErrorContext = { direction: string; source: string }
type Operation = (options: Record<string, unknown>) => Promise<unknown>

/**
 * Custom codecs, one per format, branching on the direction: request (encode) schemas take the domain value
 * and transform it to the wire value, response (decode) schemas transform the wire value back.
 * - `format: uri` (`url` node): `URL` <-> its string
 * - `format: int64` (`bigint` node): `bigint` <-> its decimal string
 * - `format: date` (`date` node): `Date` <-> `YYYY-MM-DD`
 * - `format: date-time` (`datetime` node): `Date` <-> ISO date-time
 */
const customCodecs: PrinterZodNodes = {
  url() {
    return this.options.direction === 'encode' ? 'z.instanceof(URL).transform((url) => url.href)' : 'z.url().transform((value) => new URL(value))'
  },
  bigint() {
    return this.options.direction === 'encode' ? 'z.bigint().transform((value) => value.toString())' : 'z.string().transform((value) => BigInt(value))'
  },
  date() {
    return this.options.direction === 'encode'
      ? 'z.date().transform((value) => value.toISOString().slice(0, 10))'
      : 'z.iso.date().transform((value) => new Date(value))'
  },
  datetime() {
    return this.options.direction === 'encode' ? 'z.date().transform((value) => value.toISOString())' : 'z.iso.datetime().transform((value) => new Date(value))'
  },
}

/**
 * Generates the `codecParams.yaml` client into this package, so the generated code resolves `zod`, and loads it
 * with an in-memory transport that records every request. `revision` is the wire value the fake server answers
 * `getResource` with: a string for the bigint codec, a number for `integerType: 'number'`.
 */
async function loadClient(
  mode: string,
  plugins: Array<unknown>,
  { adapter = {}, revision = '9007199254740993' }: { adapter?: Parameters<typeof adapterOas>[0]; revision?: unknown } = {},
) {
  const output = path.join(__dirname, `.codec-${mode}-${Date.now()}`)
  const { files, diagnostics } = await createKubb(
    {
      root: __dirname,
      input: '../../schemas/3.0.x/codecParams.yaml',
      output: { path: output, barrel: false },
      adapter: adapterOas({ validate: false, ...adapter }),
      parsers: [parserTs()],
      reporters: [],
      storage: fsStorage(),
      plugins,
    } as Config,
    { hooks: new Hookable<KubbHooks>() },
  ).safeBuild()
  expect(Diagnostics.hasError(diagnostics)).toBe(false)

  const requests: Array<ResolvedRequest> = []
  const { client } = await import(pathToFileURL(path.join(output, '.kubb/client.ts')).href)
  client.setConfig({
    baseURL: 'https://api.test',
    transport: async (request: ResolvedRequest) => {
      requests.push(request)
      return {
        data: request.url.includes('/resources/') ? { resource: 'https://docs.test/guide', revision } : { startsAt: '2026-10-01T09:00:00.000Z' },
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        request: new Request('https://api.test'),
        response: new Response(),
      }
    },
  })
  const { putEvent } = (await import(pathToFileURL(path.join(output, 'clients/putEvent.ts')).href)) as { putEvent: Operation }
  const { getResource } = (await import(pathToFileURL(path.join(output, 'clients/getResource.ts')).href)) as { getResource: Operation }

  return { mode, output, files, requests, putEvent, getResource }
}

type Client = Awaited<ReturnType<typeof loadClient>>

/**
 * Compares every generated file with its snapshot under `__snapshots__/codecParams/<mode>/`, like the other
 * config suites, so a change to the generated client, schemas, or runtime shows up in review.
 */
async function matchGeneratedFiles(client: Client) {
  for (const file of client.files) {
    try {
      const fileContent = await fs.readFile(file.path, 'utf-8')
      await expect(fileContent).toMatchFileSnapshot(
        path.join(__dirname, '__snapshots__', 'codecParams', client.mode, getRelativePath(client.output, file.path)),
      )
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
    }
  }
}

function readSchemas(client: Client, name: string) {
  return fs.readFile(path.join(client.output, 'zod', name), 'utf-8')
}

/**
 * Asserts a call is rejected with a `ParseError` reporting the given request `source`, before anything is sent.
 */
async function expectRejected(client: Client, call: (onValidationError: unknown) => Promise<unknown>, source: string) {
  const contexts: Array<ValidationErrorContext> = []
  await expect(call((_error: unknown, context: ValidationErrorContext) => void contexts.push(context))).rejects.toMatchObject({ name: 'ParseError' })
  expect(contexts).toMatchObject([{ direction: 'request', source }])
  expect(client.requests).toHaveLength(0)
}

// Codecs with params validation: every param slot takes the domain value and is encoded before sending.
// `'direction'` types the request side from `z.input`, exactly the domain value the encode schemas accept,
// so the types and the runtime agree.
describe("directional codec: pluginZod({ inferred: 'direction' }) + validator.params: 'zod'", () => {
  let client: Client

  beforeAll(async () => {
    client = await loadClient('infer-direction-params', [
      pluginZod({ inferred: 'direction', output: { path: './zod', barrel: false }, printer: { nodes: customCodecs } }),
      pluginFetch({ output: { path: './clients', barrel: false }, validator: { request: 'zod', params: 'zod', response: 'zod' } }),
    ])
  })
  afterAll(async () => fs.rm(client.output, { recursive: true, force: true }))
  beforeEach(() => {
    client.requests.length = 0
  })

  const body = { startsAt: new Date('2026-10-01T09:00:00.000Z') }

  test('generates the client, schemas, and runtime', async () => {
    await matchGeneratedFiles(client)
  })

  test('types the request side with z.input, the domain value the encode schemas accept', async () => {
    const schemas = await readSchemas(client, 'putEventSchema.ts')
    expect(schemas).toContain('export type PutEventPathSchemaType = z.input<typeof putEventPathSchema>')
    expect(schemas).toContain('export type PutEventOptionsSchemaType = z.input<typeof putEventOptionsSchema>')
  })

  test('encodes a Date path param to its `format: date` wire form', async () => {
    await client.putEvent({ path: { day: new Date('2026-10-01T00:00:00.000Z') }, body })
    expect(client.requests[0]?.url).toBe('https://api.test/events/2026-10-01')
  })

  test('encodes a Date query param to its `format: date-time` wire form', async () => {
    await client.putEvent({ path: { day: new Date('2026-10-01T00:00:00.000Z') }, query: { after: new Date('2026-09-01T09:00:00.000Z') }, body })
    expect(client.requests[0]?.url).toBe('https://api.test/events/2026-10-01?after=2026-09-01T09%3A00%3A00.000Z')
  })

  test('encodes a Date header param, matching the header name case-insensitively', async () => {
    await client.putEvent({ path: { day: new Date('2026-10-01T00:00:00.000Z') }, headers: { 'x-since': new Date('2026-08-01T00:00:00.000Z') }, body })
    expect(client.requests[0]?.headers['x-since']).toBe('2026-08-01T00:00:00.000Z')
  })

  test.each([
    { source: 'path', options: { path: { day: '2026-10-01' } } },
    { source: 'query', options: { path: { day: new Date('2026-10-01T00:00:00.000Z') }, query: { after: '2026-09-01T09:00:00.000Z' } } },
    { source: 'headers', options: { path: { day: new Date('2026-10-01T00:00:00.000Z') }, headers: { 'X-Since': '2026-08-01T00:00:00.000Z' } } },
  ])('rejects a wire string in the $source slot before anything is sent', async ({ source, options }) => {
    await expectRejected(client, (onValidationError) => client.putEvent({ ...options, body, onValidationError }), source)
  })

  test('encodes URL and bigint params with custom codecs and decodes the URL and bigint response', async () => {
    const result = (await client.getResource({
      path: { resource: new URL('https://docs.test/guide') },
      query: { callback: new URL('https://hooks.test/done?id=1'), revision: 9007199254740993n },
      headers: { 'X-Origin': new URL('https://app.test') },
    })) as { data: { resource: URL; revision: bigint } }
    expect(client.requests[0]?.url).toBe(
      'https://api.test/resources/https%3A%2F%2Fdocs.test%2Fguide?callback=https%3A%2F%2Fhooks.test%2Fdone%3Fid%3D1&revision=9007199254740993',
    )
    expect(client.requests[0]?.headers['X-Origin']).toBe('https://app.test/')
    expect(result.data.resource).toBeInstanceOf(URL)
    expect(result.data.resource.href).toBe('https://docs.test/guide')
    // 2^53 + 1, beyond Number.MAX_SAFE_INTEGER, so only an exact bigint round trip gets it right.
    expect(result.data.revision).toBe(9007199254740993n)
  })

  test.each([
    { source: 'path', options: { path: { resource: 'https://docs.test/guide' } } },
    { source: 'query', options: { path: { resource: new URL('https://docs.test/guide') }, query: { callback: 'https://hooks.test/done' } } },
    { source: 'query', options: { path: { resource: new URL('https://docs.test/guide') }, query: { revision: '9007199254740993' } } },
    { source: 'headers', options: { path: { resource: new URL('https://docs.test/guide') }, headers: { 'X-Origin': 'https://app.test' } } },
  ])('rejects a wire string for a custom codec in the $source slot', async ({ source, options }) => {
    await expectRejected(client, (onValidationError) => client.getResource({ ...options, onValidationError }), source)
  })
})

// Params validation without codecs. `inferred: true` types the request side from `z.infer`, the schema output.
// That only matches what the validators accept when no schema converts a value: with a codec, `z.infer` is the
// wire string while the encode schema accepts only the domain value, so a typed call could never pass. So this
// combination uses plain wire schemas: `dateType: 'string'`, `integerType: 'number'`, and no custom codecs.
// The validators then check the wire values and send them as passed, and the types describe those same values.
describe("validated wire value: pluginZod({ inferred: true }) + validator.params: 'zod', without codecs", () => {
  let client: Client

  beforeAll(async () => {
    client = await loadClient(
      'infer-params',
      [
        pluginZod({ inferred: true, output: { path: './zod', barrel: false } }),
        pluginFetch({ output: { path: './clients', barrel: false }, validator: { request: 'zod', params: 'zod', response: 'zod' } }),
      ],
      { adapter: { dateType: 'string', integerType: 'number' }, revision: 42 },
    )
  })
  afterAll(async () => fs.rm(client.output, { recursive: true, force: true }))
  beforeEach(() => {
    client.requests.length = 0
  })

  const body = { startsAt: '2026-10-01T09:00:00.000Z' }

  test('generates the client, schemas, and runtime', async () => {
    await matchGeneratedFiles(client)
  })

  test('types the request side with z.infer, the same wire values the schemas accept, since no schema converts', async () => {
    const putEventSchemas = await readSchemas(client, 'putEventSchema.ts')
    const getResourceSchemas = await readSchemas(client, 'getResourceSchema.ts')
    expect(putEventSchemas).toContain('export type PutEventOptionsSchemaType = z.infer<typeof putEventOptionsSchema>')
    expect(putEventSchemas).not.toContain('.transform(')
    expect(getResourceSchemas).not.toContain('.transform(')
  })

  test('validates path, query, header, and body wire values and sends them as passed', async () => {
    await client.putEvent({
      path: { day: '2026-10-01' },
      query: { after: '2026-09-01T09:00:00.000Z' },
      headers: { 'X-Since': '2026-08-01T00:00:00.000Z' },
      body,
    })
    expect(client.requests[0]?.url).toBe('https://api.test/events/2026-10-01?after=2026-09-01T09%3A00%3A00.000Z')
    expect(client.requests[0]?.headers['X-Since']).toBe('2026-08-01T00:00:00.000Z')
    expect(client.requests[0]?.body).toBe(JSON.stringify(body))
  })

  test('validates uri and int64 wire values and leaves the response as wire values', async () => {
    const result = (await client.getResource({
      path: { resource: 'https://docs.test/guide' },
      query: { callback: 'https://hooks.test/done?id=1', revision: 42 },
      headers: { 'X-Origin': 'https://app.test' },
    })) as { data: { resource: string; revision: number } }
    expect(client.requests[0]?.url).toBe(
      'https://api.test/resources/https%3A%2F%2Fdocs.test%2Fguide?callback=https%3A%2F%2Fhooks.test%2Fdone%3Fid%3D1&revision=42',
    )
    expect(client.requests[0]?.headers['X-Origin']).toBe('https://app.test')
    expect(result.data).toStrictEqual({ resource: 'https://docs.test/guide', revision: 42 })
  })

  test.each([
    { source: 'path', options: { path: { day: 'not-a-date' } } },
    { source: 'query', options: { path: { day: '2026-10-01' }, query: { after: 'whenever' } } },
    { source: 'headers', options: { path: { day: '2026-10-01' }, headers: { 'X-Since': 'yesterday' } } },
  ])('rejects an invalid wire value in the $source slot before anything is sent', async ({ source, options }) => {
    await expectRejected(client, (onValidationError) => client.putEvent({ ...options, body, onValidationError }), source)
  })
})

// Without params validation, unchanged from before: params are wire values, sent as passed and unchecked.
// Codecs would still work here, since only the response is validated: `z.infer` types requests as wire values,
// which are sent as passed, and responses as the decoded domain values. This suite uses the same plain wire
// schemas as above (`dateType: 'string'`, `integerType: 'number'`, no custom codecs) anyway, because turning on
// request or params validation would then run encode schemas that accept only the domain value (`instanceof
// URL`) while the types still say wire value.
describe('wire value: pluginZod({ inferred: true }) without params validation', () => {
  let client: Client

  beforeAll(async () => {
    client = await loadClient(
      'infer',
      [
        pluginZod({ inferred: true, output: { path: './zod', barrel: false } }),
        pluginFetch({ output: { path: './clients', barrel: false }, validator: 'zod' }),
      ],
      { adapter: { dateType: 'string', integerType: 'number' }, revision: 42 },
    )
  })
  afterAll(async () => fs.rm(client.output, { recursive: true, force: true }))
  beforeEach(() => {
    client.requests.length = 0
  })

  const body = { startsAt: '2026-10-01T09:00:00.000Z' }

  test('generates the client, schemas, and runtime', async () => {
    await matchGeneratedFiles(client)
  })

  test('sends path, query, and header wire strings as passed', async () => {
    await client.putEvent({
      path: { day: '2026-10-01' },
      query: { after: '2026-09-01T09:00:00.000Z' },
      headers: { 'X-Since': '2026-08-01T00:00:00.000Z' },
      body,
    })
    expect(client.requests[0]?.url).toBe('https://api.test/events/2026-10-01?after=2026-09-01T09%3A00%3A00.000Z')
    expect(client.requests[0]?.headers['X-Since']).toBe('2026-08-01T00:00:00.000Z')
  })

  test('does not validate or encode params', async () => {
    await client.putEvent({ path: { day: 'not-a-date' }, query: { after: 'whenever' }, headers: { 'X-Since': 'yesterday' }, body })
    expect(client.requests[0]?.url).toBe('https://api.test/events/not-a-date?after=whenever')
    expect(client.requests[0]?.headers['X-Since']).toBe('yesterday')
  })

  test('sends uri and int64 wire values as passed and leaves the response as wire values', async () => {
    const result = (await client.getResource({
      path: { resource: 'https://docs.test/guide' },
      query: { callback: 'https://hooks.test/done?id=1', revision: 42 },
      headers: { 'X-Origin': 'https://app.test' },
    })) as { data: { resource: string; revision: number } }
    expect(client.requests[0]?.url).toBe(
      'https://api.test/resources/https%3A%2F%2Fdocs.test%2Fguide?callback=https%3A%2F%2Fhooks.test%2Fdone%3Fid%3D1&revision=42',
    )
    expect(client.requests[0]?.headers['X-Origin']).toBe('https://app.test')
    expect(result.data).toStrictEqual({ resource: 'https://docs.test/guide', revision: 42 })
  })
})
