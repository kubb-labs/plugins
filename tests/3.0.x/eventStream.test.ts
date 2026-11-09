import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginVueQuery } from '@kubb/plugin-vue-query'
import { pluginZod } from '@kubb/plugin-zod'
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
        expect(client).toContain('StreamResult<')
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

describe('event stream runtime', () => {
  test('is not written for a document without an event stream', async () => {
    const output = await fs.mkdtemp(path.join(dirname, '.no-event-stream-'))
    try {
      const { diagnostics } = await createKubb(
        {
          root: dirname,
          input: '../../schemas/3.0.x/petStore.yaml',
          output: { path: output, barrel: false },
          adapter: adapterOas({ validate: false }),
          parsers: [parserTs()],
          reporters: [],
          storage: fsStorage(),
          plugins: [pluginTs({ output: { path: './types', barrel: false } }), pluginFetch({ output: { path: './clients', barrel: false } })],
        } as Config,
        { hooks: new Hookable<KubbHooks>() },
      ).safeBuild()
      expect(Diagnostics.hasError(diagnostics), JSON.stringify(diagnostics)).toBe(false)

      expect(await fs.readdir(path.join(output, '.kubb'))).toStrictEqual(['client.ts', 'core.ts', 'mediaTypes.ts', 'serializers.ts', 'standardSchema.ts'])
      expect(await fs.readFile(path.join(output, '.kubb', 'client.ts'), 'utf8')).not.toContain('streamMediaTypes')
    } finally {
      await fs.rm(output, { recursive: true, force: true })
    }
  })
})

describe('a response that offers JSON or an event stream', () => {
  async function generate({ output, clientPlugin }: { output: string; clientPlugin: typeof pluginFetch | typeof pluginAxios }) {
    const { diagnostics } = await createKubb(
      {
        root: dirname,
        input: '../../schemas/3.0.x/eventStreamMixed.yaml',
        output: { path: output, barrel: false },
        adapter: adapterOas({ validate: false }),
        parsers: [parserTs()],
        reporters: [],
        storage: fsStorage(),
        plugins: [pluginTs({ output: { path: './types', barrel: false } }), clientPlugin({ output: { path: './clients', barrel: false } })],
      } as Config,
      { hooks: new Hookable<KubbHooks>() },
    ).safeBuild()
    expect(Diagnostics.hasError(diagnostics), JSON.stringify(diagnostics)).toBe(false)
  }

  test.each([
    { name: 'axios', clientPlugin: pluginAxios },
    { name: 'fetch', clientPlugin: pluginFetch },
  ])('asks $name for the event stream and ships the runtime to parse it', async ({ clientPlugin }) => {
    const output = await fs.mkdtemp(path.join(dirname, '.event-stream-mixed-'))
    try {
      await generate({ output, clientPlugin })

      expect(await fs.readFile(path.join(output, '.kubb', 'sse.ts'), 'utf8')).toContain('export async function* parseEventStream')
      expect(await fs.readFile(path.join(output, '.kubb', 'client.ts'), 'utf8')).toMatch(/export \* from '\.\/sse\.ts'\s*$/)

      const client = await fs.readFile(path.join(output, 'clients', 'listChanges.ts'), 'utf8')
      expect(client).toContain('RequestResult<ListChangesResponses')
      expect(client).toContain("contentType: { response: 'text/event-stream' }")
    } finally {
      await fs.rm(output, { recursive: true, force: true })
    }
  })

  test('returns the event stream as a stream to parse, and JSON when the caller picks it', async () => {
    const output = await fs.mkdtemp(path.join(dirname, '.event-stream-mixed-run-'))
    try {
      await generate({ output, clientPlugin: pluginFetch })

      const accepts: Array<string | undefined> = []
      const { client, parseEventStream } = await import(pathToFileURL(path.join(output, '.kubb/client.ts')).href)
      client.setConfig({
        baseURL: 'https://api.test',
        transport: async (request: { headers: Record<string, string> }) => {
          const accept = request.headers['Accept']
          accepts.push(accept)
          return accept === 'text/event-stream'
            ? new Response('data: {"$schema":"change"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
            : Response.json({ $schema: 'change' })
        },
      })
      const { listChanges } = await import(pathToFileURL(path.join(output, 'clients/listChanges.ts')).href)

      const stream = await listChanges()
      expect(stream.contentType).toBe('text/event-stream')
      expect(stream.data).toBeInstanceOf(ReadableStream)
      const events = []
      for await (const event of parseEventStream(stream.data)) events.push(event)
      expect(events).toStrictEqual([{ event: 'message', data: { $schema: 'change' } }])

      const json = await listChanges({ contentType: { response: 'application/json' } })
      expect(json).toMatchObject({ contentType: 'application/json', data: { $schema: 'change' } })
      expect(accepts).toStrictEqual(['text/event-stream', 'application/json'])
    } finally {
      await fs.rm(output, { recursive: true, force: true })
    }
  })
})

describe('OpenAPI 3.2 item schemas', () => {
  async function readAll(dir: string): Promise<string> {
    const files = await fs.readdir(dir, { recursive: true })
    const sources = await Promise.all(files.filter((file) => file.endsWith('.ts')).map((file) => fs.readFile(path.join(dir, file), 'utf8')))
    return sources.join('\n')
  }

  test.each([
    { name: 'axios', clientPlugin: pluginAxios },
    { name: 'fetch', clientPlugin: pluginFetch },
  ])('types each $name event by name, validates per event, keeps a payload-only item, and streams JSON Lines', async ({ clientPlugin }) => {
    const output = await fs.mkdtemp(path.join(dirname, '.event-stream-3-2-'))
    try {
      const { diagnostics } = await createKubb(
        {
          root: dirname,
          input: '../../schemas/3.0.x/eventStream3_2.yaml',
          output: { path: output, barrel: false },
          adapter: adapterOas({ validate: false }),
          parsers: [parserTs()],
          reporters: [],
          storage: fsStorage(),
          plugins: [
            pluginTs({ output: { path: './types', barrel: false } }),
            pluginZod({ output: { path: './zod', barrel: false } }),
            clientPlugin({ output: { path: './clients', barrel: false }, validator: 'zod' }),
          ],
        } as Config,
        { hooks: new Hookable<KubbHooks>() },
      ).safeBuild()
      expect(Diagnostics.hasError(diagnostics), JSON.stringify(diagnostics)).toBe(false)

      const runtime = await fs.readFile(path.join(output, '.kubb', 'sse.ts'), 'utf8')
      expect(runtime).toContain('export const streamMediaTypes')
      const clientRuntime = await fs.readFile(path.join(output, '.kubb', 'client.ts'), 'utf8')
      expect(clientRuntime).toContain('client.setConfig({ mediaTypes: { ...streamMediaTypes } })')
      expect(clientRuntime).toMatch(/export \* from '\.\/sse\.ts'\s*$/)

      // The runtime validates each item with the response validator, by the event shape the call carries.
      const chat = await fs.readFile(path.join(output, 'clients', 'streamChat.ts'), 'utf8')
      expect(chat).toContain('Unwrappable<StreamResult<StreamChatResponses, ThrowOnError, TypedEvent<SuccessOf<StreamChatResponses>>>>')
      expect(chat).toContain("eventShape: 'event'")
      expect(chat).toMatch(/validator: \{[^}]*response:/)
      expect(chat).not.toMatch(/ as /)

      const ticks = await fs.readFile(path.join(output, 'clients', 'streamTicks.ts'), 'utf8')
      expect(ticks).toContain('Unwrappable<StreamResult<StreamTicksResponses, ThrowOnError>>')
      expect(ticks).toContain("eventShape: 'data'")

      // JSON Lines streams one LogEntry per line, validated per line.
      const logs = await fs.readFile(path.join(output, 'clients', 'streamLogs.ts'), 'utf8')
      expect(logs).toContain('Unwrappable<StreamResult<StreamLogsResponses, ThrowOnError, SuccessOf<StreamLogsResponses>>>')
      expect(logs).toContain('apiClient.stream<StreamLogsResponses, ThrowOnError, SuccessOf<StreamLogsResponses>>(')
      expect(logs).toContain("contentType: { response: 'application/jsonl' }")
      expect(logs).not.toContain('eventShape')
      expect(logs).not.toContain('responseType')

      const types = await readAll(path.join(output, 'types'))
      expect(types).toMatch(/event: ['"]message_delta['"]/)
      expect(types).toMatch(/data\?: MessageDelta/)
      expect(types).toMatch(/StreamLogsStatus200 = LogEntry/)

      const zod = await readAll(path.join(output, 'zod'))
      expect(zod).toContain("z.discriminatedUnion('event'")
    } finally {
      await fs.rm(output, { recursive: true, force: true })
    }
  })
})
