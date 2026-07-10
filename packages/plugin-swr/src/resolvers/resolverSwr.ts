import { createMutationResolver, createQueryResolver } from '@internals/tanstack-query'
import { capitalize } from '@internals/utils'
import { createResolver } from 'kubb/kit'
import type { PluginSwr } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-swr`. Decides the names and file paths for every generated
 * SWR hook (`useFoo`, `useFooMutation`) and its companion helpers (`fooQueryKey`, `fooQueryOptions`,
 * `fooMutationKey`).
 *
 * Functions and files use the built-in camelCase casing; hooks get the `use` prefix.
 *
 * @example Resolve hook and helper names
 * ```ts
 * import { resolverSwr } from '@kubb/plugin-swr'
 *
 * resolverSwr.query.name(operationNode)       // 'useGetPetById'
 * resolverSwr.query.keyName(operationNode)     // 'getPetByIdQueryKey'
 * resolverSwr.mutation.name(operationNode)     // 'useUpdatePet'
 * ```
 */
export const resolverSwr = createResolver<PluginSwr>({
  pluginName: 'plugin-swr',
  query: createQueryResolver(),
  mutation: {
    ...createMutationResolver(),
    keyTypeName(node) {
      return `${capitalize(this.name(node.operationId))}MutationKey`
    },
    argTypeName(node) {
      return `${capitalize(this.name(node.operationId))}MutationArg`
    },
  },
})
