/**
 * Comparative benchmarks: Kubb vs Orval vs Hey-API
 *
 * Measures performance (time + memory) of three OpenAPI code generators across:
 * - 3 schemas: petStore (~22 KB, small), twitter (~375 KB, medium), stripe (~7.7 MB, large)
 * - 3 plugin combinations:
 *     A) TypeScript only
 *     B) TypeScript + Zod
 *     C) TypeScript + React-Query + Zod
 *
 * Disk I/O policy:
 *   Kubb    → write: false   (pure in-memory, no disk I/O)
 *   Hey-API → dryRun: true   (pure in-memory, no disk I/O)
 *   Orval   → writes to /tmp (disk I/O is part of its cost; no dry-run API exists)
 *
 * Run from the benchmark directory:
 *   pnpm bench
 *
 * Or from the repo root:
 *   pnpm run test:bench
 */

import { mkdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient as heyApiCreate, type UserConfig as HeyApiConfig } from '@hey-api/openapi-ts'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, createKubb, type Plugin } from '@kubb/core'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'
import { generate as orvalGenerate } from 'orval'
import { afterAll, bench, describe } from 'vitest'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCHEMAS = path.resolve(__dirname, '../../schemas/3.0.x')
const TMP_ORVAL = path.join(os.tmpdir(), 'kubb-benchmark', 'orval')

mkdirSync(TMP_ORVAL, { recursive: true })

const schema = {
  petStore: path.join(SCHEMAS, 'petStore.yaml'),
  twitter: path.join(SCHEMAS, 'twitter.json'),
  stripe: path.join(SCHEMAS, 'stripe.json'),
}

// ---------------------------------------------------------------------------
// Memory tracking
// ---------------------------------------------------------------------------

const memDeltas = new Map<string, number[]>()

function recordMem(key: string, baseline: number) {
  const delta = process.memoryUsage().heapUsed - baseline
  const bucket = memDeltas.get(key) ?? []
  bucket.push(delta)
  memDeltas.set(key, bucket)
}

// ---------------------------------------------------------------------------
// Kubb runners (write: false = pure in-memory, no disk I/O)
// ---------------------------------------------------------------------------

const kubbTsOnly: Plugin[] = [
  pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' }),
] as Plugin[]

const kubbTsZod: Plugin[] = [
  pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' }),
  pluginZod({ output: { path: 'zod', barrel: false } }),
] as Plugin[]

const kubbTsZodRq: Plugin[] = [
  pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' }),
  pluginZod({ output: { path: 'zod', barrel: false } }),
  pluginReactQuery({ output: { path: 'hooks' } }),
] as Plugin[]

async function runKubb(schemaPath: string, plugins: Plugin[]) {
  const config = defineConfig({
    root: '.',
    input: { path: schemaPath },
    adapter: adapterOas({ validate: false }),
    output: { path: './src/gen', clean: false, write: false },
    plugins,
  })
  await createKubb(config, { hooks: new AsyncEventEmitter() }).build()
}

// ---------------------------------------------------------------------------
// Orval runners (always writes to /tmp; no dry-run API)
// ---------------------------------------------------------------------------

const ZOD_GENERATE = {
  generate: { body: true, query: true, param: true, header: true, response: true },
}

async function runOrval(schemaPath: string, client: 'fetch' | 'react-query', withZod = false) {
  await orvalGenerate(
    {
      input: {
        target: schemaPath,
        validation: false,
      },
      output: {
        target: path.join(TMP_ORVAL, 'api.ts'),
        client,
        mode: 'single',
        clean: false,
        ...(withZod ? { override: { zod: ZOD_GENERATE } } : {}),
      },
    },
    __dirname,
  )
}

// ---------------------------------------------------------------------------
// Hey-API runners (dryRun: true = pure in-memory, no disk I/O)
// ---------------------------------------------------------------------------

async function runHeyApi(schemaPath: string, plugins: HeyApiConfig['plugins']) {
  await heyApiCreate({
    input: schemaPath,
    output: path.join(os.tmpdir(), 'kubb-benchmark', 'heyapi'),
    plugins,
    dryRun: true,
    logs: { level: 'silent' },
  })
}

// ---------------------------------------------------------------------------
// Memory report (printed once after all benchmarks finish)
// ---------------------------------------------------------------------------

afterAll(() => {
  const MB = (n: number) => `${(Math.abs(n) / 1_048_576).toFixed(2)} MB`
  const lines: string[] = [
    '',
    '══════════════════════════════════════════════════════════════════════',
    '  Memory Usage Report (approximate heap delta per iteration)',
    '══════════════════════════════════════════════════════════════════════',
  ]

  for (const [key, deltas] of memDeltas) {
    if (deltas.length === 0) continue
    const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length
    const max = Math.max(...deltas)
    const min = Math.min(...deltas)
    lines.push(`  ${key.padEnd(55)} avg ${MB(avg).padStart(9)}  min ${MB(min).padStart(9)}  max ${MB(max).padStart(9)}  (n=${deltas.length})`)
  }

  lines.push('══════════════════════════════════════════════════════════════════════')
  console.log(lines.join('\n'))
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBenchFn(key: string, fn: () => Promise<void>) {
  return async () => {
    const baseline = process.memoryUsage().heapUsed
    await fn()
    recordMem(key, baseline)
  }
}

// ---------------------------------------------------------------------------
// ❶ petStore  (small ~22 KB, 18 paths)
// ---------------------------------------------------------------------------

describe('petStore (small ~22 KB)', () => {
  const opts = { iterations: 5, warmupIterations: 1 }

  describe('TypeScript only', () => {
    bench('kubb',    makeBenchFn('petStore › ts › kubb',    () => runKubb(schema.petStore, kubbTsOnly)), opts)
    bench('orval',   makeBenchFn('petStore › ts › orval',   () => runOrval(schema.petStore, 'fetch')), opts)
    bench('hey-api', makeBenchFn('petStore › ts › hey-api', () => runHeyApi(schema.petStore, ['@hey-api/typescript'])), opts)
  })

  describe('TypeScript + Zod', () => {
    bench('kubb',    makeBenchFn('petStore › ts+zod › kubb',    () => runKubb(schema.petStore, kubbTsZod)), opts)
    bench('orval',   makeBenchFn('petStore › ts+zod › orval',   () => runOrval(schema.petStore, 'fetch', true)), opts)
    bench('hey-api', makeBenchFn('petStore › ts+zod › hey-api', () => runHeyApi(schema.petStore, ['@hey-api/typescript', 'zod'])), opts)
  })

  describe('TypeScript + React-Query + Zod', () => {
    bench('kubb',    makeBenchFn('petStore › ts+rq+zod › kubb',    () => runKubb(schema.petStore, kubbTsZodRq)), opts)
    bench('orval',   makeBenchFn('petStore › ts+rq+zod › orval',   () => runOrval(schema.petStore, 'react-query', true)), opts)
    bench('hey-api', makeBenchFn('petStore › ts+rq+zod › hey-api', () => runHeyApi(schema.petStore, ['@hey-api/typescript', 'zod', '@tanstack/react-query'])), opts)
  })
})

// ---------------------------------------------------------------------------
// ❷ twitter  (medium ~375 KB, 3 paths)
// ---------------------------------------------------------------------------

describe('twitter (medium ~375 KB)', () => {
  // hey-api takes ~8 s per run on twitter; keep it to 1 sample to bound total time
  const opts      = { iterations: 3, warmupIterations: 1 }
  const slowOpts  = { iterations: 1, warmupIterations: 0 }

  describe('TypeScript only', () => {
    bench('kubb',    makeBenchFn('twitter › ts › kubb',    () => runKubb(schema.twitter, kubbTsOnly)), opts)
    bench('orval',   makeBenchFn('twitter › ts › orval',   () => runOrval(schema.twitter, 'fetch')), opts)
    bench('hey-api', makeBenchFn('twitter › ts › hey-api', () => runHeyApi(schema.twitter, ['@hey-api/typescript'])), slowOpts)
  })

  describe('TypeScript + Zod', () => {
    bench('kubb',    makeBenchFn('twitter › ts+zod › kubb',    () => runKubb(schema.twitter, kubbTsZod)), opts)
    bench('orval',   makeBenchFn('twitter › ts+zod › orval',   () => runOrval(schema.twitter, 'fetch', true)), opts)
    bench('hey-api', makeBenchFn('twitter › ts+zod › hey-api', () => runHeyApi(schema.twitter, ['@hey-api/typescript', 'zod'])), slowOpts)
  })

  describe('TypeScript + React-Query + Zod', () => {
    bench('kubb',    makeBenchFn('twitter › ts+rq+zod › kubb',    () => runKubb(schema.twitter, kubbTsZodRq)), opts)
    bench('orval',   makeBenchFn('twitter › ts+rq+zod › orval',   () => runOrval(schema.twitter, 'react-query', true)), opts)
    bench('hey-api', makeBenchFn('twitter › ts+rq+zod › hey-api', () => runHeyApi(schema.twitter, ['@hey-api/typescript', 'zod', '@tanstack/react-query'])), slowOpts)
  })
})

// ---------------------------------------------------------------------------
// ❸ stripe   (large ~7.7 MB, 414 paths, 1 385 schemas)
// ---------------------------------------------------------------------------

// hey-api takes >2 minutes per run on the stripe schema (7.7 MB, 1385 schemas) and is
// excluded from these benchmarks to keep the suite under the 10-minute time budget.
describe('stripe (large ~7.7 MB, 414 paths, 1385 schemas)', () => {
  const opts = { iterations: 2, warmupIterations: 1 }

  describe('TypeScript only', () => {
    bench('kubb',  makeBenchFn('stripe › ts › kubb',  () => runKubb(schema.stripe, kubbTsOnly)), opts)
    bench('orval', makeBenchFn('stripe › ts › orval', () => runOrval(schema.stripe, 'fetch')), opts)
  })

  describe('TypeScript + Zod', () => {
    bench('kubb',  makeBenchFn('stripe › ts+zod › kubb',  () => runKubb(schema.stripe, kubbTsZod)), opts)
    bench('orval', makeBenchFn('stripe › ts+zod › orval', () => runOrval(schema.stripe, 'fetch', true)), opts)
  })

  describe('TypeScript + React-Query + Zod', () => {
    bench('kubb',  makeBenchFn('stripe › ts+rq+zod › kubb',  () => runKubb(schema.stripe, kubbTsZodRq)), opts)
    bench('orval', makeBenchFn('stripe › ts+rq+zod › orval', () => runOrval(schema.stripe, 'react-query', true)), opts)
  })
})
