import { adapterOas } from '@kubb/adapter-oas'
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
        adapter: adapterOas(),
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
          pluginVueQuery({
            output: {
              path: './hooks',
            },
            pathParamsType: 'object',
          }),
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ['axios'],
  },
})
