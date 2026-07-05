import { defineResolver } from 'kubb/kit'
import type { PluginSwr } from '../types.ts'

function capitalize(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

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
export const resolverSwr = defineResolver<PluginSwr>(() => ({
  pluginName: 'plugin-swr',
  query: {
    name(node) {
      return `use${capitalize(this.name(node.operationId))}`
    },
    optionsName(node) {
      return `${this.name(node.operationId)}QueryOptions`
    },
    keyName(node) {
      return `${this.name(node.operationId)}QueryKey`
    },
    keyTypeName(node) {
      return `${capitalize(this.name(node.operationId))}QueryKey`
    },
    clientName(node) {
      return this.name(node.operationId)
    },
  },
  mutation: {
    name(node) {
      return `use${capitalize(this.name(node.operationId))}`
    },
    keyName(node) {
      return `${this.name(node.operationId)}MutationKey`
    },
    keyTypeName(node) {
      return `${capitalize(this.name(node.operationId))}MutationKey`
    },
    argTypeName(node) {
      return `${capitalize(this.name(node.operationId))}MutationArg`
    },
  },
}))
