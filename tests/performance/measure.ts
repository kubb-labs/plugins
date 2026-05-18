/**
 * Measures wall-clock time and peak heap delta for:
 *   beta.15 behaviour — adapter.parse() always (batch)
 *   beta.16 behaviour — adapter.stream() when schemas > 100
 *
 * Run with:  npx tsx tests/performance/measure.ts
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Adapter } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, createKubb, type Plugin } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')
const schemasDir = path.resolve(rootDir, 'schemas/3.0.x')

const specs = [
  { name: 'petStore.yaml', schemas: 9, note: 'below threshold → always batch' },
  { name: 'twitter.json', schemas: 236, note: 'above threshold → streams in beta.16' },
  { name: 'digitalocean.yaml', schemas: 312, note: 'above threshold → streams in beta.16' },
  { name: 'bunq.com.json', schemas: 617, note: 'above threshold → streams in beta.16' },
] as const

const pluginSuites: Array<{ label: string; plugins: Plugin[] }> = [
  {
    label: 'plugin-ts',
    plugins: [pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' })] as Plugin[],
  },
  {
    label: 'plugin-ts + plugin-zod',
    plugins: [
      pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' }),
      pluginZod({ output: { path: 'zod', barrel: false }, inferred: true }),
    ] as Plugin[],
  },
]

function batchOnly(adapter: Adapter): Adapter {
  const { count: _c, stream: _s, ...rest } = adapter as Adapter & { count?: unknown; stream?: unknown }
  return rest as Adapter
}

type Sample = { ms: number; heapMb: number }

async function runOnce(specPath: string, streaming: boolean, plugins: Plugin[]): Promise<Sample> {
  if (typeof globalThis.gc === 'function') globalThis.gc()

  const heapBefore = process.memoryUsage().heapUsed
  const adapter = adapterOas({ validate: false })

  const config = defineConfig({
    root: rootDir,
    input: { path: specPath },
    adapter: streaming ? adapter : batchOnly(adapter),
    output: { path: './src/gen', clean: false, write: false },
    plugins,
  })

  const t0 = performance.now()
  await createKubb(config, { hooks: new AsyncEventEmitter() }).build()
  const ms = performance.now() - t0
  const heapMb = Math.max(0, (process.memoryUsage().heapUsed - heapBefore) / 1024 / 1024)

  return { ms, heapMb }
}

async function measure(specPath: string, streaming: boolean, plugins: Plugin[], runs = 4): Promise<Sample> {
  const samples: Sample[] = []
  // one warmup, then measured runs
  await runOnce(specPath, streaming, plugins)
  for (let i = 0; i < runs; i++) samples.push(await runOnce(specPath, streaming, plugins))

  // drop min and max, average the rest
  const sorted = [...samples].sort((a, b) => a.ms - b.ms)
  const trimmed = sorted.length > 2 ? sorted.slice(1, -1) : sorted
  return {
    ms: trimmed.reduce((s, r) => s + r.ms, 0) / trimmed.length,
    heapMb: trimmed.reduce((s, r) => s + r.heapMb, 0) / trimmed.length,
  }
}

function pad(s: string, n: number) { return s.padStart(n) }

console.log('\nKubb beta.15 (batch) vs beta.16 (streaming) — wall-clock time & heap growth\n')
const HDR = `${'Spec'.padEnd(24)} ${'Plugins'.padEnd(26)} ${'β15 ms'.padStart(8)} ${'β16 ms'.padStart(8)} ${'Speedup'.padStart(12)} ${'β15 heap'.padStart(10)} ${'β16 heap'.padStart(10)} ${'Heap Δ'.padStart(9)}`
console.log(HDR)
console.log('─'.repeat(HDR.length))

for (const { name, schemas, note } of specs) {
  const specPath = path.resolve(schemasDir, name)
  const specLabel = `${name} (${schemas})`
  console.log(`\n  ${specLabel}  —  ${note}`)

  for (const { label, plugins } of pluginSuites) {
    process.stdout.write(`    measuring batch...  `)
    const batch = await measure(specPath, false, plugins)
    process.stdout.write(`done\n    measuring stream... `)
    const stream = await measure(specPath, true, plugins)
    process.stdout.write(`done\n`)

    const speedup = batch.ms / stream.ms
    const speedupStr = speedup >= 1.01
      ? `${speedup.toFixed(2)}× faster`
      : speedup < 0.99
        ? `${(1 / speedup).toFixed(2)}× slower`
        : `~same`
    const heapDiff = batch.heapMb - stream.heapMb
    const heapStr = Math.abs(heapDiff) < 0.2
      ? `~same`
      : heapDiff > 0
        ? `-${heapDiff.toFixed(1)} MB`
        : `+${Math.abs(heapDiff).toFixed(1)} MB`

    console.log(
      `  ${specLabel.padEnd(24)} ${label.padEnd(26)} ${pad(`${Math.round(batch.ms)} ms`, 8)} ${pad(`${Math.round(stream.ms)} ms`, 8)} ${pad(speedupStr, 12)} ${pad(`${batch.heapMb.toFixed(1)} MB`, 10)} ${pad(`${stream.heapMb.toFixed(1)} MB`, 10)} ${pad(heapStr, 9)}`
    )
  }
}

console.log('\nLegend:')
console.log('  beta.15 behaviour = batchOnly() wrapper forces adapter.parse() on every spec')
console.log('  beta.16 behaviour = adapterOas() with count()+stream() enabled; auto-streams when schemas > 100')
console.log('  Heap Δ  = β15 heap growth minus β16 heap growth (negative = streaming uses more)')
console.log('  Timings = median of 4 runs, best+worst dropped; gc() forced before each run')
