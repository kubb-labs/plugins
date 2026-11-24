import { defineConfig } from 'tsdown'
import { pluginBuilds } from '../../configs/tsdown.ts'

export default defineConfig([
  ...pluginBuilds(),
  {
    // Declarations for the raw templates so consumers can import their types without `allowImportingTsExtensions`.
    entry: {
      'templates/client': 'templates/client.ts',
      'templates/auth': 'templates/auth.ts',
      'templates/core': 'templates/core.ts',
      'templates/mediaTypes': 'templates/mediaTypes.ts',
      'templates/mediaTypes/formData': 'templates/mediaTypes/formData.ts',
      'templates/mediaTypes/urlencoded': 'templates/mediaTypes/urlencoded.ts',
      'templates/retry': 'templates/retry.ts',
      'templates/serializers': 'templates/serializers.ts',
      'templates/serializers/cookies': 'templates/serializers/cookies.ts',
      'templates/serializers/headers': 'templates/serializers/headers.ts',
      'templates/serializers/path': 'templates/serializers/path.ts',
      'templates/serializers/pathStyles': 'templates/serializers/pathStyles.ts',
      'templates/serializers/query': 'templates/serializers/query.ts',
      'templates/serializers/queryStyles': 'templates/serializers/queryStyles.ts',
      'templates/sse': 'templates/sse.ts',
      'templates/standardSchema': 'templates/standardSchema.ts',
      'templates/types': 'templates/types.ts',
    },
    format: 'esm',
    fixedExtension: false,
    dts: { dtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
  },
])
