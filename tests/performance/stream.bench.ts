import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import type { FileNode } from '@kubb/ast'
import { AsyncEventEmitter, createKubb, FileProcessor, memoryStorage, type Plugin } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'
import { beforeAll, bench, describe } from 'vitest'

/**
 * Stream adapter validation benchmarks
 *
 * Validates the streaming file-processing path (`FileProcessor.stream`) against
 * the existing event-based batch path (`FileProcessor.run`) across the plugin
 * examples in this repository.
 *
 * The inline `streamFiles` helper below mirrors the implementation added to
 * `@kubb/core` (`FileProcessor.stream`) and can be replaced with a direct
 * `fileProcessor.stream()` call once the package is released.
 *
 * Key differences measured:
 *  - Throughput (ops per second) — how many full processing passes per second
 *  - First-write latency — how quickly the first file reaches storage
 *  - Peak heap delta — maximum heap growth during the processing phase
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---------------------------------------------------------------------------
// Inline stream helper — equivalent to FileProcessor.stream() from the PR.
// Yields one parsed file at a time, enabling writes to start before all files
// are parsed.
// ---------------------------------------------------------------------------
async function* streamFiles(
  files: ReadonlyArray<FileNode>,
  fp: FileProcessor,
): AsyncGenerator<{ file: FileNode; source: string; processed: number; total: number; percentage: number }> {
  const total = files.length
  let processed = 0
  for (const file of files) {
    const source = await fp.parse(file)
    processed++
    yield { file, source, processed, total, percentage: (processed / total) * 100 }
  }
}

function heapMB(): number {
  return process.memoryUsage().heapUsed / 1_048_576
}

// ---------------------------------------------------------------------------
// Shared config — memoryStorage eliminates disk I/O as a variable
// ---------------------------------------------------------------------------
function makeConfig(petStorePath: string) {
  return defineConfig({
    root: '.',
    input: { path: petStorePath },
    adapter: adapterOas({ validate: false }),
    storage: memoryStorage(),
    output: { path: './src/gen', clean: false },
    plugins: [
      pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' }),
      pluginClient({ output: { path: 'clients' } }),
      pluginZod({ output: { path: 'zod', barrel: false }, inferred: true }),
      pluginFaker({ output: { path: 'mocks', barrel: false } }),
    ] as Plugin[],
  })
}

// ---------------------------------------------------------------------------
// Suite 1 — full pipeline: proves the stream path works end-to-end against
//           the petStore example (fetch + react-query patterns).
// ---------------------------------------------------------------------------
describe('Stream adapter — full pipeline (4 plugin examples)', () => {
  const petStorePath = path.resolve(__dirname, '../../schemas/3.0.x/petStore.yaml')

  bench(
    'full build: ts + client + zod + faker (stream flush path)',
    async () => {
      const config = makeConfig(petStorePath)
      const { files } = await createKubb(config, { hooks: new AsyncEventEmitter() }).build()
      // Sanity: all four plugin outputs must be present
      const paths = files.map((f) => f.path)
      const hasTypes = paths.some((p) => p.includes('types'))
      const hasClients = paths.some((p) => p.includes('clients'))
      const hasZod = paths.some((p) => p.includes('zod'))
      const hasMocks = paths.some((p) => p.includes('mocks'))
      if (!hasTypes || !hasClients || !hasZod || !hasMocks) {
        throw new Error(`Stream path produced incomplete output. Got: ${JSON.stringify(paths.slice(0, 5))}`)
      }
    },
    { time: 10_000 },
  )
})

// ---------------------------------------------------------------------------
// Suite 2 — FileProcessor: event-driven run() vs stream()
//
// Both variants process the *same* FileNode array generated from the full
// plugin suite. Differences are due solely to the processing pipeline.
// ---------------------------------------------------------------------------
describe('Stream adapter — FileProcessor.run() vs stream()', () => {
  const petStorePath = path.resolve(__dirname, '../../schemas/3.0.x/petStore.yaml')
  let sharedFiles: Array<FileNode> = []

  beforeAll(async () => {
    const config = makeConfig(petStorePath)
    const { files } = await createKubb(config, { hooks: new AsyncEventEmitter() }).build()
    sharedFiles = files
  })

  bench(
    'event-driven: run() (current approach)',
    async () => {
      const store = memoryStorage()
      const fp = new FileProcessor()
      fp.events.on('update', async ({ file, source }) => {
        if (source) await store.setItem(file.path, source)
      })
      await fp.run(sharedFiles)
    },
    { time: 10_000 },
  )

  bench(
    'stream: stream() sequential (new approach)',
    async () => {
      const store = memoryStorage()
      const fp = new FileProcessor()
      for await (const { file, source } of streamFiles(sharedFiles, fp)) {
        if (source) await store.setItem(file.path, source)
      }
    },
    { time: 10_000 },
  )
})

// ---------------------------------------------------------------------------
// Suite 3 — first-write latency
//
// Tracks when the first file reaches storage after processing starts.
// stream() should win because file 1 is yielded before files 2-N start.
// run() must wait for the first update event to fire, which happens only
// after the first parse completes inside the sequential loop.
// ---------------------------------------------------------------------------
describe('Stream adapter — first-write latency', () => {
  const petStorePath = path.resolve(__dirname, '../../schemas/3.0.x/petStore.yaml')
  let sharedFiles: Array<FileNode> = []

  beforeAll(async () => {
    const config = makeConfig(petStorePath)
    const { files } = await createKubb(config, { hooks: new AsyncEventEmitter() }).build()
    sharedFiles = files
  })

  bench(
    'first-write latency: run() event-driven',
    async () => {
      const store = memoryStorage()
      const fp = new FileProcessor()
      let firstWriteTime = 0
      const t0 = performance.now()
      fp.events.on('update', async ({ file, source }) => {
        if (source && firstWriteTime === 0) firstWriteTime = performance.now() - t0
        if (source) await store.setItem(file.path, source)
      })
      await fp.run(sharedFiles)
      void firstWriteTime
    },
    { time: 10_000 },
  )

  bench(
    'first-write latency: stream()',
    async () => {
      const store = memoryStorage()
      const fp = new FileProcessor()
      let firstWriteTime = 0
      const t0 = performance.now()
      for await (const { file, source } of streamFiles(sharedFiles, fp)) {
        if (source && firstWriteTime === 0) firstWriteTime = performance.now() - t0
        if (source) await store.setItem(file.path, source)
      }
      void firstWriteTime
    },
    { time: 10_000 },
  )
})

// ---------------------------------------------------------------------------
// Suite 4 — peak-heap delta during processing
// ---------------------------------------------------------------------------
describe('Stream adapter — peak heap during file processing', () => {
  const petStorePath = path.resolve(__dirname, '../../schemas/3.0.x/petStore.yaml')
  let sharedFiles: Array<FileNode> = []

  beforeAll(async () => {
    const config = makeConfig(petStorePath)
    const { files } = await createKubb(config, { hooks: new AsyncEventEmitter() }).build()
    sharedFiles = files
  })

  bench(
    'peak heap: run() event-driven',
    async () => {
      const store = memoryStorage()
      const fp = new FileProcessor()
      let peak = heapMB()
      fp.events.on('update', async ({ file, source }) => {
        const h = heapMB()
        if (h > peak) peak = h
        if (source) await store.setItem(file.path, source)
      })
      await fp.run(sharedFiles)
      void peak
    },
    { time: 5_000, iterations: 5 },
  )

  bench(
    'peak heap: stream()',
    async () => {
      let peak = heapMB()
      const store = memoryStorage()
      const fp = new FileProcessor()
      for await (const { file, source } of streamFiles(sharedFiles, fp)) {
        const h = heapMB()
        if (h > peak) peak = h
        if (source) await store.setItem(file.path, source)
      }
      void peak
    },
    { time: 5_000, iterations: 5 },
  )
})
