import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, createKubb } from '@kubb/core'
import { type Plugin } from 'kubb/kit'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'
import { bench, describe } from 'vitest'

/**
 * Performance benchmarks for Kubb plugin generation
 *
 * These benchmarks test the performance of generating code from OpenAPI specifications
 * using different plugin configurations. They help track performance regressions and
 * identify optimization opportunities.
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Plugin Generation Performance', () => {
  const petStorePath = path.resolve(__dirname, '../../schemas/3.0.x/petStore.yaml')

  bench(
    'single plugin generation (plugin-ts)',
    async () => {
      const config = defineConfig({
        root: '.',
        input: {
          path: petStorePath,
        },
        adapter: adapterOas({ validate: false }),
        output: {
          path: './src/gen',
          clean: false,
          write: false,
        },
        plugins: [
          pluginTs({
            output: {
              path: 'types',
              barrel: false,
            },
            enum: { type: 'asConst' },
          }),
        ] as Plugin[],
      })

      const hooks = new AsyncEventEmitter()
      await createKubb(config, { hooks }).build()
    },
    {
      time: 10000,
    },
  )

  bench(
    'multiple plugins generation (plugin-ts + plugin-axios)',
    async () => {
      const config = defineConfig({
        root: '.',
        input: {
          path: petStorePath,
        },
        adapter: adapterOas({ validate: false }),
        output: {
          path: './src/gen',
          clean: false,
          write: false,
        },
        plugins: [
          pluginTs({
            output: {
              path: 'types',
              barrel: false,
            },
            enum: { type: 'asConst' },
          }),
          pluginAxios({
            output: {
              path: 'clients',
            },
          }),
        ] as Plugin[],
      })

      const hooks = new AsyncEventEmitter()
      await createKubb(config, { hooks }).build()
    },
    {
      time: 10000,
    },
  )

  bench(
    'comprehensive plugin suite generation',
    async () => {
      const config = defineConfig({
        root: '.',
        input: {
          path: petStorePath,
        },
        adapter: adapterOas({ validate: false }),
        output: {
          path: './src/gen',
          clean: false,
          write: false,
        },
        plugins: [
          pluginTs({
            output: {
              path: 'types',
              barrel: false,
            },
            enum: { type: 'asConst' },
          }),
          pluginAxios({
            output: {
              path: 'clients',
            },
          }),
          pluginZod({
            output: {
              path: 'zod',
              barrel: false,
            },
            inferred: true,
          }),
          pluginFaker({
            output: {
              path: 'mocks',
              barrel: false,
            },
          }),
        ] as Plugin[],
      })

      const hooks = new AsyncEventEmitter()
      await createKubb(config, { hooks }).build()
    },
    {
      time: 10000,
    },
  )
})
