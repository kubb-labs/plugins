import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginVueQuery } from '@kubb/plugin-vue-query'
import vue from '@vitejs/plugin-vue'
import kubb from 'unplugin-kubb/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    kubb({
      config: {
        root: '.',
        input: {
          path: './petStore.yaml',
        },
        adapter: adapterOas({ enums: 'root' }),
        output: {
          path: './src/gen',
          clean: true,
          format: 'oxfmt',
        },
        plugins: [
          pluginTs({
            output: {
              path: 'models',
            },
          }),
          // A registered contract client. pluginVueQuery auto-detects it (no `client` option needed) and
          // the composables call its generated `<op>` functions, which return the shared `RequestResult` contract.
          pluginClient({
            output: {
              path: './clients',
            },
          }),
          pluginVueQuery({
            output: {
              path: './hooks',
            },
          }),
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ['axios'],
  },
})
