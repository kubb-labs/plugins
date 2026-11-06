import path from 'node:path'
import { isEventStream } from '@internals/shared'
import type { ast } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'

/**
 * The `footer` of `.kubb/client.ts`: the `baseURL` set at generation time, and the `sse.ts` re-export when the document
 * streams events, so `ServerSentEvent` and `toEventStream` stay importable from the client as in earlier releases.
 */
export function buildClientFooter({ baseURL, sse }: { baseURL?: string; sse: boolean }): string | undefined {
  const baseURLExpression = baseURL ? (baseURL.includes('${') ? `\`${baseURL.replaceAll('`', '\\`')}\`` : JSON.stringify(baseURL)) : undefined
  return (
    [baseURLExpression ? `client.setConfig({ baseURL: ${baseURLExpression} })` : null, sse ? `export * from './sse.ts'` : null].filter(Boolean).join('\n') ||
    undefined
  )
}

/**
 * Copies `sse.ts` into `.kubb/` and re-exports it from `.kubb/client.ts`, only for a document with a `text/event-stream`
 * operation, so a document without streams ships no stream runtime. The client file keeps the copy the plugin injected;
 * only its footer is replaced, which is why the `baseURL` line is rebuilt here.
 */
export function StreamRuntime({ nodes, root, sse, baseURL }: { nodes: Array<ast.OperationNode>; root: string; sse?: string; baseURL?: string }): KubbReactNode {
  if (!sse || !nodes.some(isEventStream)) return null
  return (
    <>
      <File baseName="sse.ts" path={path.resolve(root, '.kubb/sse.ts')} copy={sse} />
      <File baseName="client.ts" path={path.resolve(root, '.kubb/client.ts')} footer={buildClientFooter({ baseURL, sse: true })} />
    </>
  )
}
