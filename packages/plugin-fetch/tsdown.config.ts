import { defineConfig } from 'tsdown'
import { sharedTemplates } from '../../configs/sharedTemplates.ts'
import { packageBuilds } from '../../configs/tsdown.ts'

export default defineConfig([
  ...packageBuilds(),
  {
    // Declarations for the raw templates so consumers can import their types without `allowImportingTsExtensions`.
    entry: {
      'templates/client': 'templates/client.ts',
    },
    format: 'esm',
    fixedExtension: false,
    inputOptions: sharedTemplates,
    dts: { dtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
  },
])
