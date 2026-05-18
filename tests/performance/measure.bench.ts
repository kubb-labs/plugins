/**
 * Measures wall-clock time and peak heap delta for beta.15 vs beta.16 behaviour.
 *
 *   beta.15 = adapter.parse() forced for every spec (batchOnly wrapper)
 *   beta.16 = adapter.stream() auto-selected when schemas > 100
 *
 * Run with:  pnpm test:bench
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Adapter } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, createKubb, type Plugin } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'
import { bench, describe } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemasDir = path.resolve(__dirname, '../../schemas/3.0.x')

function batchOnly(adapter: Adapter): Adapter {
  const { count: _c, stream: _s, ...rest } = adapter as Adapter & { count?: unknown; stream?: unknown }
  return rest as Adapter
}

const MB = 1024 * 1024

function buildConfig(specPath: string, streaming: boolean, plugins: Plugin[]) {
  const adapter = adapterOas({ validate: false })
  return defineConfig({
    root: '.',
    input: { path: specPath },
    adapter: streaming ? adapter : batchOnly(adapter),
    output: { path: './src/gen', clean: false, write: false },
    plugins,
  })
}

const tsOnly = [pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' })] as Plugin[]
const tsAndZod = [
  pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' }),
  pluginZod({ output: { path: 'zod', barrel: false }, inferred: true }),
] as Plugin[]

type HeapStats = { before: number; after: number; delta: number }
const heapLog: Record<string, HeapStats> = {}

async function run(label: string, specPath: string, streaming: boolean, plugins: Plugin[]) {
  if (typeof globalThis.gc === 'function') globalThis.gc()
  const before = process.memoryUsage().heapUsed
  await createKubb(buildConfig(specPath, streaming, plugins), { hooks: new AsyncEventEmitter() }).build()
  const after = process.memoryUsage().heapUsed
  heapLog[label] = { before, after, delta: after - before }
}

const specs = [
  { file: 'twitter.json', schemas: 236 },
] as const

for (const { file, schemas } of specs) {
  const specPath = path.resolve(schemasDir, file)
  const title = `beta.15 vs beta.16 — ${file} (${schemas} schemas)`

  describe(title, () => {
    bench(`beta.15 batch — plugin-ts`, async () => {
      await run(`${file} batch ts`, specPath, false, tsOnly)
    }, { iterations: 3, warmupIterations: 1 })

    bench(`beta.16 stream — plugin-ts`, async () => {
      await run(`${file} stream ts`, specPath, true, tsOnly)
    }, { iterations: 3, warmupIterations: 1 })

    bench(`beta.15 batch — plugin-ts + plugin-zod`, async () => {
      await run(`${file} batch ts+zod`, specPath, false, tsAndZod)
    }, { iterations: 3, warmupIterations: 1 })

    bench(`beta.16 stream — plugin-ts + plugin-zod`, async () => {
      await run(`${file} stream ts+zod`, specPath, true, tsAndZod)
    }, { iterations: 3, warmupIterations: 1 })
  })
}

// Print heap table after all suites finish
process.on('exit', () => {
  if (Object.keys(heapLog).length === 0) return
  console.log('\n── Heap growth per run (last measurement per label) ──')
  const rows = Object.entries(heapLog).map(([label, { delta }]) => ({
    label,
    deltaMb: (delta / MB).toFixed(1),
  }))
  const maxLabel = Math.max(...rows.map((r) => r.label.length))
  for (const { label, deltaMb } of rows) {
    console.log(`  ${label.padEnd(maxLabel)}  ${deltaMb.padStart(7)} MB`)
  }
})
