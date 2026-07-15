import { createClientGenerator } from '@internals/client'
import type { PluginAxios } from '../types.ts'

/**
 * Built-in operation generator for `@kubb/plugin-axios`. Emits one async function per OpenAPI
 * operation using the shared `Operation` component: a grouped `<Name>Request` type and a function
 * that forwards a single `options` object to the bundled `client` and returns the `RequestResult`.
 */
export const clientGenerator = createClientGenerator<PluginAxios>('axios')
