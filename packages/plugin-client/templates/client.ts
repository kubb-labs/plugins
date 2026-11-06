// Stands in for the transport's `client.ts` next to `sse.ts`, so the shared templates typecheck on their own. In the
// generated `.kubb/` folder, `sse.ts` reads these from the real client; this file is never copied.
export type { DataShape, Options } from './core.ts'
export type NativeRequest = unknown
export type NativeResponse = unknown
