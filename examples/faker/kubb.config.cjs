const { defineConfig } = require('kubb')

const { adapterOas } = require('@kubb/adapter-oas')
const { pluginFaker } = require('@kubb/plugin-faker')
const { pluginTs } = require('@kubb/plugin-ts')

module.exports = defineConfig(() => {
  return [
    {
      root: '.',
      input: './petStore.yaml',
      output: {
        path: './src/gen',
        lint: false,
        format: false,
        clean: true,
        postGenerate: ['npm run typecheck'],
      },
      adapter: adapterOas({ unknownType: 'unknown' }),
      plugins: [
        pluginTs({
          output: {
            path: 'models',
            mode: 'directory',
          },
        }),
        pluginFaker({
          output: {
            path: './tag',
            mode: 'directory',
          },
          include: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          typeMode: 'schema',
        }),
      ],
    },
    {
      root: '.',
      input: './petStore.yaml',
      output: {
        path: './src/gen',
        lint: false,
        format: false,
        postGenerate: ['npm run typecheck'],
      },
      adapter: adapterOas({ unknownType: 'unknown', dateType: 'string' }),
      plugins: [
        pluginTs({
          output: {
            path: 'models',
            mode: 'directory',
          },
        }),
        pluginFaker({
          output: {
            path: './faker',
            mode: 'directory',
          },
          include: [
            {
              type: 'operationId',
              pattern: 'updatePet',
            },
          ],
          exclude: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          override: [
            {
              type: 'schemaName',
              pattern: /Order/i,
              options: {
                dateParser: 'dayjs',
              },
            },
          ],
        }),
      ],
    },
  ]
})
