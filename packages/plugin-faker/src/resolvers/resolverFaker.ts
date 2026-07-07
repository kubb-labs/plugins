import { camelCase, ensureValidVarName, toFilePath } from "@internals/utils";
import { createResolver } from "kubb/kit";
import type { PluginFaker } from "../types.ts";

/**
 * Default resolver used by `@kubb/plugin-faker`. Decides the names and file
 * paths for every generated mock factory. Functions and files are prefixed
 * with `create` so `Pet` becomes `createPet`.
 *
 * @example Resolve a factory name
 * ```ts
 * import { resolverFaker } from '@kubb/plugin-faker'
 *
 * resolverFaker.name('list pets') // 'createListPets'
 * ```
 */
export const resolverFaker = createResolver<PluginFaker>({
  pluginName: "plugin-faker",
  name(name) {
    return ensureValidVarName(camelCase(name, { prefix: "create" }));
  },
  file(params, context) {
    return this.default.file(
      {
        ...params,
        resolveName: (name) =>
          toFilePath(name, (part) => camelCase(part, { prefix: "create" })),
      },
      context,
    );
  },
  param: {
    name(node, param) {
      return this.name(`${node.operationId} ${param.in} ${param.name}`);
    },
    path(node, param) {
      return this.param.name(node, param);
    },
    query(node, param) {
      return this.param.name(node, param);
    },
    headers(node, param) {
      return this.param.name(node, param);
    },
  },
  response: {
    status(node, statusCode) {
      return this.name(`${node.operationId} Status ${statusCode}`);
    },
    body(node) {
      return this.name(`${node.operationId} Body`);
    },
    response(node) {
      return this.name(`${node.operationId} Response`);
    },
    responses(node) {
      return this.name(`${node.operationId} Responses`);
    },
  },
});
