import { Runtime } from './Runtime.tsx'
import { SyncRuntime } from './SyncRuntime.tsx'
import type { KubbReactElement } from './types.ts'

/**
 * A renderer factory for generators that produce JSX output.
 *
 * Pass this as the `renderer` property of a `defineGenerator` call so that
 * core can render the JSX element tree returned by your generator methods
 * without a hard dependency on `@kubb/renderer-jsx`.
 *
 * @example
 * ```ts
 * import { jsxRenderer } from '@kubb/renderer-jsx'
 * import { defineGenerator } from '@kubb/core'
 *
 * export const myGenerator = defineGenerator<PluginTs>({
 *   name: 'my-generator',
 *   renderer: jsxRenderer,
 *   schema(node, options) {
 *     return <File baseName="output.ts" path="src/output.ts">...</File>
 *   },
 * })
 * ```
 */
export const jsxRenderer = () => {
  const runtime = new Runtime()
  return {
    async render(element: KubbReactElement) {
      await runtime.render(element)
    },
    get files() {
      return runtime.nodes
    },
    unmount(error?: Error | number | null) {
      runtime.unmount(error)
    },
  }
}

/**
 * Synchronous recursive renderer — no React reconciler.
 *
 * Identical output to `jsxRenderer` but bypasses the React fiber/scheduler
 * entirely. Suitable when all components are pure functions with no hooks.
 */
export const jsxRendererSync = () => {
  const runtime = new SyncRuntime()
  return {
    render(element: KubbReactElement) {
      runtime.render(element)
      return Promise.resolve()
    },
    get files() {
      return runtime.nodes
    },
    unmount(error?: Error | number | null) {
      runtime.unmount(error)
    },
  }
}
