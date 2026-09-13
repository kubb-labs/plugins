import { createCasedFile } from '@internals/shared'
import { camelCase, ensureValidVarName } from '@internals/utils'
import { createResolver } from 'kubb/kit'
import type { PluginPlaywright } from '../types.ts'

/**
 * Prefixes helper names and filenames with `pw` from the original operationId.
 */
export const resolverPlaywright = createResolver<PluginPlaywright>({
  pluginName: 'plugin-playwright',
  name(name) {
    return ensureValidVarName(camelCase(name, { prefix: 'pw' }))
  },
  file: createCasedFile((part) => camelCase(part, { prefix: 'pw' })),
})
