import path from 'node:path'
import { hasEventStreamContent } from '@internals/shared'
import type { ast } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'

/**
 * The `footer` of `.kubb/client.ts`: the `baseURL` set at generation time, and the `sse.ts` re-export when the document
 * streams events, so `ServerSentEvent` and `toEventStream` stay importable from the client as in earlier releases.
 */
function buildClientFooter({ baseURL, sse }: { baseURL?: string; sse: boolean }): string | undefined {
  const baseURLExpression = baseURL ? (baseURL.includes('${') ? `\`${baseURL.replaceAll('`', '\\`')}\`` : JSON.stringify(baseURL)) : undefined
  return (
    [baseURLExpression ? `client.setConfig({ baseURL: ${baseURLExpression} })` : null, sse ? `export * from './sse.ts'` : null].filter(Boolean).join('\n') ||
    undefined
  )
}

/**
 * Writes the footer of the `.kubb/client.ts` the plugin injected, the one place it is built, and copies `sse.ts` into
 * `.kubb/` only for a document with an operation that offers `text/event-stream`, also next to another content type, so a
 * document without streams ships no stream runtime. `sse` is set by the plugins that ship the runtime, so a custom client
 * from `@kubb/plugin-client` gets neither file.
 */
export function StreamRuntime({ nodes, root, sse, baseURL }: { nodes: Array<ast.OperationNode>; root: string; sse?: string; baseURL?: string }): KubbReactNode {
  if (!sse) return null
  const streams = nodes.some(hasEventStreamContent)
  const footer = buildClientFooter({ baseURL, sse: streams })
  return (
    <>
      {streams && <File baseName="sse.ts" path={path.resolve(root, '.kubb/sse.ts')} copy={sse} />}
      {footer && <File baseName="client.ts" path={path.resolve(root, '.kubb/client.ts')} footer={footer} />}
    </>
  )
}
