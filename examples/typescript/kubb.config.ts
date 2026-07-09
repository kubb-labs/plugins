import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb/config'

const input = './petStore.yaml'

export default defineConfig([
  {
    root: '.',
    input,
    output: {
      path: './src/legacy',
      clean: true,
      format: false,
      lint: false,
    },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: {
          path: 'models.ts',
          mode: 'file',
          barrel: false,
        },
        transformer: {
          // Make all properties of the "Pet" schema required
          property(node, { parent }) {
            if (parent?.name === 'Address') {
              return { ...node, required: false }
            }
          },
        },
        enum: { type: 'enum' },
        syntaxType: 'interface',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: {
      path: './src/gen',
      clean: true,
      format: false,
      lint: false,
    },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: {
          path: 'models.ts',
          mode: 'file',
          barrel: false,
        },
        enum: { type: 'asConst', keyCasing: 'screamingSnakeCase' },
        arrayType: 'generic',
        syntaxType: 'interface',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen2', clean: true, format: false, lint: false },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: {
          path: 'modelsConst.ts',
          mode: 'file',
          barrel: false,
        },
        enum: { type: 'asConst', typeSuffix: 'enumType' },
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen3', clean: true, format: false, lint: false },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: {
          path: 'modelsPascalConst.ts',
          mode: 'file',
          barrel: false,
        },
        enum: { type: 'asConst', constCasing: 'pascalCase' },
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen4', clean: true, format: false, lint: false },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: {
          path: 'modelsConstEnum.ts',
          mode: 'file',
          barrel: false,
        },
        enum: { type: 'constEnum' },
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen5', clean: true, format: false, lint: false },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: {
          path: 'modelsLiteral.ts',
          mode: 'file',
          barrel: false,
        },
        enum: { type: 'literal' },
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen6', clean: true, format: false, lint: false, postGenerate: ['npm run typecheck'] },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: {
          path: 'ts/models',
        },
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen7', clean: true, format: false, lint: false },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: { path: 'modelsInlineLiteral.ts', mode: 'file', barrel: false },
        enum: { type: 'inlineLiteral' },
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen8', clean: true, format: false, lint: false },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: { path: 'modelsOptionalUndefined.ts', mode: 'file', barrel: false },
        enum: { type: 'inlineLiteral' },
        optionalType: 'undefined',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen9', clean: true, format: false, lint: false },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: { path: 'modelsOptionalBoth.ts', mode: 'file', barrel: false },
        enum: { type: 'inlineLiteral' },
        optionalType: 'questionTokenAndUndefined',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen10', clean: true, format: false, lint: false },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: { path: 'models' },
        enum: { type: 'inlineLiteral' },
        group: { type: 'tag' },
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen11', clean: true, format: false, lint: false },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: { path: 'modelsPascalCaseKeys.ts', mode: 'file', barrel: false },
        enum: { type: 'asConst', keyCasing: 'pascalCase' },
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen12', clean: true, format: false, lint: false, postGenerate: ['npm run typecheck'] },
    adapter: adapterOas({ unknownType: 'unknown', validate: false, enums: 'root' }),
    plugins: [
      pluginTs({
        output: { path: 'modelsCamelCaseKeys.ts', mode: 'file', barrel: false },
        enum: { type: 'asConst', keyCasing: 'camelCase' },
      }),
    ],
  },
])
