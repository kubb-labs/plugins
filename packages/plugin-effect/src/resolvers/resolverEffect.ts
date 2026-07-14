import { createCasedFile, createOperationParamResolver, createOperationResponseResolver } from '@internals/shared'
import { ensureValidVarName, pascalCase } from '@internals/utils'
import { createResolver } from 'kubb/kit'
import type { PluginEffect } from '../types.ts'

/**
 * Default PascalCase resolver for Effect schemas and their matching types.
 */
export const resolverEffect = createResolver<PluginEffect>({
  pluginName: 'plugin-effect',
  name(name) {
    return ensureValidVarName(pascalCase(name))
  },
  file: createCasedFile(pascalCase),
  param: createOperationParamResolver(),
  response: {
    ...createOperationResponseResolver(),
    error(node) {
      return this.name(`${node.operationId} Error`)
    },
  },
})
