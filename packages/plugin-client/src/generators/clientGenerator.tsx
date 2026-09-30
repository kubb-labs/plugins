import { createClientGenerator } from '@internals/client'
import type { PluginClient } from '../types.ts'

/**
 * Built-in operation generator for `@kubb/plugin-client`. Emits one async function per OpenAPI
 * operation using the shared `Operation` component: a grouped `<Name>Request` type and a function
 * that forwards a single `options` object to the user-provided client module and returns the `RequestResult`.
 */
export const clientGenerator = createClientGenerator<PluginClient>('client', (options) => options.importPath)
