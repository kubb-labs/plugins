import { createResolver } from "kubb/kit";
import type { PluginReactQuery } from "../types.ts";

function capitalize(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

/**
 * Default resolver used by `@kubb/plugin-react-query`. Decides the names and
 * file paths for every generated TanStack Query hook (`useFoo`,
 * `useFooSuspense`, `useFooInfinite`, ...) and its companion helpers
 * (`fooQueryKey`, `fooQueryOptions`).
 *
 * Functions and files use the built-in camelCase casing; hooks get the `use`
 * prefix; suspense and infinite variants are suffixed with `Suspense`/`Infinite`.
 *
 * @example Resolve hook and helper names
 * ```ts
 * import { resolverReactQuery } from '@kubb/plugin-react-query'
 *
 * resolverReactQuery.query.name(operationNode)       // 'useGetPetById'
 * resolverReactQuery.mutation.name(operationNode)    // 'useUpdatePet'
 * resolverReactQuery.query.keyName(operationNode)     // 'getPetByIdQueryKey'
 * resolverReactQuery.query.optionsName(operationNode) // 'getPetByIdQueryOptions'
 * ```
 */
export const resolverReactQuery = createResolver<PluginReactQuery>({
  pluginName: "plugin-react-query",
  query: {
    name(node) {
      return `use${capitalize(this.name(node.operationId))}`;
    },
    optionsName(node) {
      return `${this.name(node.operationId)}QueryOptions`;
    },
    keyName(node) {
      return `${this.name(node.operationId)}QueryKey`;
    },
    keyTypeName(node) {
      return `${capitalize(this.name(node.operationId))}QueryKey`;
    },
    clientName(node) {
      return this.name(node.operationId);
    },
  },
  suspenseQuery: {
    name(node) {
      return `use${capitalize(this.name(node.operationId))}Suspense`;
    },
    optionsName(node) {
      return `${this.name(node.operationId)}SuspenseQueryOptions`;
    },
    keyName(node) {
      return `${this.name(node.operationId)}SuspenseQueryKey`;
    },
    keyTypeName(node) {
      return `${capitalize(this.name(node.operationId))}SuspenseQueryKey`;
    },
    clientName(node) {
      return `${this.name(node.operationId)}Suspense`;
    },
  },
  infiniteQuery: {
    name(node) {
      return `use${capitalize(this.name(node.operationId))}Infinite`;
    },
    optionsName(node) {
      return `${this.name(node.operationId)}InfiniteQueryOptions`;
    },
    keyName(node) {
      return `${this.name(node.operationId)}InfiniteQueryKey`;
    },
    keyTypeName(node) {
      return `${capitalize(this.name(node.operationId))}InfiniteQueryKey`;
    },
    clientName(node) {
      return `${this.name(node.operationId)}Infinite`;
    },
  },
  suspenseInfiniteQuery: {
    name(node) {
      return `use${capitalize(this.name(node.operationId))}SuspenseInfinite`;
    },
    optionsName(node) {
      return `${this.name(node.operationId)}SuspenseInfiniteQueryOptions`;
    },
    keyName(node) {
      return `${this.name(node.operationId)}SuspenseInfiniteQueryKey`;
    },
    keyTypeName(node) {
      return `${capitalize(this.name(node.operationId))}SuspenseInfiniteQueryKey`;
    },
    clientName(node) {
      return `${this.name(node.operationId)}SuspenseInfinite`;
    },
  },
  mutation: {
    name(node) {
      return `use${capitalize(this.name(node.operationId))}`;
    },
    optionsName(node) {
      return `${this.name(node.operationId)}MutationOptions`;
    },
    keyName(node) {
      return `${this.name(node.operationId)}MutationKey`;
    },
    typeName(node) {
      return capitalize(this.name(node.operationId));
    },
  },
  hook: {
    optionsName() {
      return "HookOptions";
    },
    customOptionsName() {
      return "getCustomHookOptions";
    },
  },
});
