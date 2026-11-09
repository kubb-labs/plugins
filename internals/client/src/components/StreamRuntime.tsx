import path from 'node:path'
import { hasEventStreamContent, hasFormBody, isEventStream } from '@internals/shared'
import type { ast } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'

/**
 * The `footer` of `.kubb/client.ts`: the `baseURL` set at generation time, the form and stream media types the document
 * needs, and the `sse.ts` re-export when it streams, so `parseEventStream` stays importable from the client.
 * `setConfig` before the first call only records the config, so the lazy client is still created on first use.
 */
function buildClientFooter({ baseURL, forms, streams }: { baseURL?: string; forms: boolean; streams: boolean }): string | undefined {
  const baseURLExpression = baseURL ? (baseURL.includes('${') ? `\`${baseURL.replaceAll('`', '\\`')}\`` : JSON.stringify(baseURL)) : undefined
  const mediaTypes = [forms ? '...formMediaTypes' : null, streams ? '...streamMediaTypes' : null].filter(Boolean)
  const config = [baseURLExpression ? `baseURL: ${baseURLExpression}` : null, mediaTypes.length ? `mediaTypes: { ${mediaTypes.join(', ')} }` : null].filter(
    Boolean,
  )
  return (
    [
      forms ? `import { formMediaTypes } from './mediaTypes.ts'` : null,
      streams ? `import { streamMediaTypes } from './sse.ts'` : null,
      config.length ? `client.setConfig({ ${config.join(', ')} })` : null,
      streams ? `export * from './sse.ts'` : null,
    ]
      .filter(Boolean)
      .join('\n') || undefined
  )
}

/**
 * Writes the footer of the `.kubb/client.ts` the plugin injected, the one place it is built, and copies `sse.ts` into
 * `.kubb/` only for a document with an operation that streams, so a document without streams ships no stream runtime.
 * The form media types are registered only for a document with a form body. `sse` is set by the plugins that ship the
 * runtime, so a custom client from `@kubb/plugin-client` gets neither.
 */
export function StreamRuntime({ nodes, root, sse, baseURL }: { nodes: Array<ast.OperationNode>; root: string; sse?: string; baseURL?: string }): KubbReactNode {
  if (!sse) return null
  const streams = nodes.some((node) => hasEventStreamContent(node) || isEventStream(node))
  const footer = buildClientFooter({ baseURL, forms: nodes.some(hasFormBody), streams })
  return (
    <>
      {streams && <File baseName="sse.ts" path={path.resolve(root, '.kubb/sse.ts')} copy={sse} />}
      {footer && <File baseName="client.ts" path={path.resolve(root, '.kubb/client.ts')} footer={footer} />}
    </>
  )
}
