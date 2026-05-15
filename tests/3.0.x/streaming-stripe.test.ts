/**
 * Stripe spec streaming e2e — memory guard
 *
 * Validates that a Kubb build over the real Stripe OpenAPI spec (≈1 385 schemas)
 * completes without error AND keeps peak RSS under 4 GB when the streaming path
 * is active (triggered because schema count > STREAM_SCHEMA_THRESHOLD=100).
 *
 * The test downloads the Stripe spec once per run into the OS temp dir and
 * skips automatically when the network is unavailable (CI without internet,
 * local offline dev, etc.).
 *
 * To run manually:
 *   cd plugins
 *   node node_modules/vitest/vitest.mjs run tests/3.0.x/streaming-stripe.test.ts
 */
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, type Config, createKubb, type KubbHooks } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'
import { beforeAll, describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STRIPE_SPEC_URL = 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json'
/** Cached between test runs so we don't re-download on every `vitest watch` iteration. */
const STRIPE_SPEC_CACHE = path.join(os.tmpdir(), 'kubb-stripe-spec3.json')

const PEAK_RSS_LIMIT_MB = 4 * 1024 // 4 GB

let stripeSpecPath: string | null = null

beforeAll(async () => {
  // Prefer the cached copy from a previous run.
  const cacheExists = await fs
    .access(STRIPE_SPEC_CACHE)
    .then(() => true)
    .catch(() => false)

  if (cacheExists) {
    stripeSpecPath = STRIPE_SPEC_CACHE
    return
  }

  try {
    const response = await fetch(STRIPE_SPEC_URL, { signal: AbortSignal.timeout(30_000) })
    if (!response.ok) return // network reachable but non-200 — skip
    const text = await response.text()
    await fs.writeFile(STRIPE_SPEC_CACHE, text, 'utf-8')
    stripeSpecPath = STRIPE_SPEC_CACHE
  } catch {
    // Network unavailable — the test will be skipped below.
  }
}, 60_000)

/**
 * Runs `fn` while sampling RSS at 50 ms intervals.
 * Returns the function's result alongside the peak RSS observed in MB.
 */
async function withPeakRss<T>(fn: () => Promise<T>): Promise<{ result: T; peakRssMB: number }> {
  let peakRss = process.memoryUsage().rss
  const sampler = setInterval(() => {
    const rss = process.memoryUsage().rss
    if (rss > peakRss) peakRss = rss
  }, 50)
  try {
    const result = await fn()
    return { result, peakRssMB: Math.round(peakRss / (1024 * 1024)) }
  } finally {
    clearInterval(sampler)
  }
}

describe('Streaming adapter — Stripe spec (≈1 385 schemas, memory guard)', () => {
  test('builds under 4 GB peak RSS via streaming path', async (ctx) => {
    if (!stripeSpecPath) {
      ctx.skip()
      return
    }

    const tmpDir = path.join(os.tmpdir(), `kubb-stripe-${Date.now()}`)

    const {
      result: { files, failedPlugins, error },
      peakRssMB,
    } = await withPeakRss(() =>
      createKubb(
        {
          root: __dirname,
          input: { path: stripeSpecPath! },
          output: { path: path.join(tmpDir, 'gen'), barrel: false },
          adapter: adapterOas({ validate: false }),
          parsers: [parserTs],
          plugins: [
            pluginTs({
              output: { path: path.join(tmpDir, 'gen/types'), barrel: false },
              group: { type: 'tag' },
            }),
          ],
        } as unknown as Config,
        { hooks: new AsyncEventEmitter<KubbHooks>() },
      ).safeBuild(),
    )

    console.log(`Peak RSS: ${peakRssMB} MB (limit: ${PEAK_RSS_LIMIT_MB} MB)`)
    console.log(`Files generated: ${files.length}`)

    expect(error, 'build must not throw').toBeUndefined()
    expect(failedPlugins.size, 'no plugin failures').toBe(0)
    // 1 385 schemas should produce at least 1 000 type files
    expect(files.length, 'expected many generated files').toBeGreaterThan(1_000)
    expect(peakRssMB, `peak RSS must be under ${PEAK_RSS_LIMIT_MB} MB`).toBeLessThan(PEAK_RSS_LIMIT_MB)

    // Spot-check: first 20 files must be written to disk with non-zero content
    for (const file of files.slice(0, 20)) {
      const stat = await fs.stat(file.path).catch(() => null)
      expect(stat, `${file.path} must exist on disk`).not.toBeNull()
      expect(stat!.size, `${file.path} must not be empty`).toBeGreaterThan(0)
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  }, 180_000)
})
