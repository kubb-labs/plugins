/**
 * Declaration-build plugin for the client templates of `@kubb/plugin-fetch` and `@kubb/plugin-axios`. The `./core.ts`
 * stub next to each template re-exports `@kubb/plugin-client` with `export *`, which the declaration bundler turns into an
 * undeclared namespace, so the shared templates resolve to the package directly.
 */
export const sharedTemplates = {
  name: 'shared-templates',
  resolveId: {
    order: 'pre' as const,
    handler(source: string) {
      const match = /^\.\/(core|serializers|standardSchema)\.ts$/.exec(source)
      return match ? { id: `@kubb/plugin-client/templates/${match[1]}.ts`, external: true } : null
    },
  },
}
