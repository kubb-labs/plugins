import path from 'node:path'
import { hasEventStreamContent, hasFormBody, isEventStream } from '@internals/shared'
import { objectKey, singleQuote } from '@internals/utils'
import type { ast } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'

function buildServers(servers: Array<ast.InputServer> | undefined): string | null {
  const named = new Map<string, string>()
  for (const server of servers ?? []) if (server.name && !named.has(server.name)) named.set(server.name, server.url)
  if (!named.size) return null
  const entries = [...named].map(([name, url]) => `${objectKey(name)}: ${singleQuote(url)}`)
  return `/**\n * The servers from the spec by name, for \`baseURL\`.\n */\nexport const servers = { ${entries.join(', ')} } as const`
}

/**
 * The `footer` of `.kubb/client.ts`: the `baseURL` set at generation time, the form and stream media types the document
 * needs, the named `servers`, and the `sse.ts` re-export when it streams, so `parseEventStream` stays importable from the
 * client. `setConfig` before the first call only records the config, so the lazy client is still created on first use.
 */
function buildClientFooter({
  baseURL,
  forms,
  streams,
  servers,
}: {
  baseURL?: string
  forms: boolean
  streams: boolean
  servers?: Array<ast.InputServer>
}): string | undefined {
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
      buildServers(servers),
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
export function StreamRuntime({
  nodes,
  root,
  sse,
  baseURL,
  servers,
}: {
  nodes: Array<ast.OperationNode>
  root: string
  sse?: string
  baseURL?: string
  servers?: Array<ast.InputServer>
}): KubbReactNode {
  if (!sse) return null
  const streams = nodes.some((node) => hasEventStreamContent(node) || isEventStream(node))
  const footer = buildClientFooter({ baseURL, forms: nodes.some(hasFormBody), streams, servers })
  return (
    <>
      {streams && <File baseName="sse.ts" path={path.resolve(root, '.kubb/sse.ts')} copy={sse} />}
      {footer && <File baseName="client.ts" path={path.resolve(root, '.kubb/client.ts')} footer={footer} />}
    </>
  )
}
