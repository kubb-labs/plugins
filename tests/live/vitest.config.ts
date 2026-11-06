import { defineConfig } from 'vitest/config'

// The suites reach the network, so they run only through `pnpm --filter tests-live test`, not the root `pnpm test`.
export default defineConfig({ test: { testTimeout: 60_000, hookTimeout: 60_000, include: ['tests/**/*.live.ts'], fileParallelism: false } })
