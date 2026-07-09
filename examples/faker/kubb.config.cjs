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
      },
      adapter: adapterOas({ unknownType: 'unknown' }),
      hooks: {
        done: ['npm run typecheck'],
      },
      plugins: [
        pluginTs({
          output: {
            path: 'models',
          },
        }),
        pluginFaker({
          output: {
            path: './tag',
            barrelType: 'propagate',
          },
          include: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          dataReturnType: 'full',
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
      },
      adapter: adapterOas({ unknownType: 'unknown' }),
      hooks: {
        done: ['npm run typecheck'],
      },
      plugins: [
        pluginTs({
          output: {
            path: 'models',
          },
        }),
        pluginFaker({
          output: {
            path: './faker',
          },
          transformers: {
            schema({ schema: _schema, name, parentName }, defaultSchemas) {
              /* override a property with name 'name'
               Pet:
                  required:
                    - name
                  type: object
                  properties:
                    name:
                      type: string
                      example: doggie
            */
              if (parentName === 'Pet' && name === 'name') {
                // see mapper where we map `productionName` to `faker.commerce.productName`, the original name will be kept.
                return [...defaultSchemas, { keyword: 'name', args: 'productName' }]
              }
              return undefined
            },
          },
          mapper: {
            productName: 'faker.commerce.productName()',
            message: 'faker.string.alpha({casing: "lower"})',
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
                dateType: 'string',
                dateParser: 'dayjs',
              },
            },
          ],
        }),
      ],
    },
  ]
})
