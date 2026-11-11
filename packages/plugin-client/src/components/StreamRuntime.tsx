import path from 'node:path'
import { getFormContentTypes, hasEventStreamContent, hasStreamVariant, isEventStream } from '@internals/shared'
import { objectKey, singleQuote } from '@internals/utils'
import type { ast } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import { buildSecuritySchemes } from '../builders/security.ts'
import type { KubbReactNode } from '@kubb/renderer-jsx'

function buildServers(servers: Array<ast.InputServer> | undefined): string | null {
  const named = new Map<string, string>()
  for (const server of servers ?? []) if (server.name && !named.has(server.name)) named.set(server.name, server.url)
  if (!named.size) return null
  const entries = [...named].map(([name, url]) => `${objectKey(name)}: ${singleQuote(url)}`)
  return `/**\n * The servers from the spec by name, for \`baseURL\`.\n */\nexport const servers = { ${entries.join(', ')} } as const`
}

// The form media types, each in its own file under `templates/mediaTypes/`, so a document ships only the ones it uses.
const formMediaTypes = {
  'multipart/form-data': { file: 'formData', name: 'multipartFormData' },
  'multipart/mixed': { file: 'mixed', name: 'multipartMixed' },
  'application/x-www-form-urlencoded': { file: 'urlencoded', name: 'urlencoded' },
} as const

type FormContentType = keyof typeof formMediaTypes

/**
 * The `footer` of `.kubb/client.ts`: the `baseURL` set at generation time, the form and stream media types the document
 * needs, the named `servers` and `securitySchemes`, and the `sse.ts` re-export when it streams, so `parseEventStream` stays importable from the
 * client. `setConfig` before the first call only records the config, so the lazy client is still created on first use.
 */
function buildClientFooter({
  baseURL,
  forms,
  streams,
  servers,
  auth,
}: {
  baseURL?: string
  forms: Array<FormContentType>
  streams: boolean
  servers?: Array<ast.InputServer>
  auth?: Array<ast.AuthScheme>
}): string | undefined {
  const baseURLExpression = baseURL ? (baseURL.includes('${') ? `\`${baseURL.replaceAll('`', '\\`')}\`` : JSON.stringify(baseURL)) : undefined
  const mediaTypes = [...forms.map((contentType) => `'${contentType}': ${formMediaTypes[contentType].name}`), streams ? '...streamMediaTypes' : null].filter(
    Boolean,
  )
  const config = [baseURLExpression ? `baseURL: ${baseURLExpression}` : null, mediaTypes.length ? `mediaTypes: { ${mediaTypes.join(', ')} }` : null].filter(
    Boolean,
  )
  return (
    [
      ...forms.map((contentType) => `import { ${formMediaTypes[contentType].name} } from './mediaTypes/${formMediaTypes[contentType].file}.ts'`),
      streams ? `import { streamMediaTypes } from './sse.ts'` : null,
      config.length ? `client.setConfig({ ${config.join(', ')} })` : null,
      buildServers(servers),
      buildSecuritySchemes(auth),
      streams ? `export * from './sse.ts'` : null,
    ]
      .filter(Boolean)
      .join('\n') || undefined
  )
}

/**
 * Writes the footer of the `.kubb/client.ts` the plugin injected, the one place it is built, and copies the optional
 * runtime into `.kubb/`: `sse.ts` only for a document with an operation that streams, and each form media type only for a
 * document with a body of that type. `templates` is the folder they are copied from, set by the plugins that ship the
 * runtime, so a custom client from `@kubb/plugin-client` gets none of them.
 */
export function StreamRuntime({
  nodes,
  root,
  templates,
  baseURL,
  servers,
  auth,
}: {
  nodes: Array<ast.OperationNode>
  root: string
  templates?: string
  baseURL?: string
  servers?: Array<ast.InputServer>
  auth?: Array<ast.AuthScheme>
}): KubbReactNode {
  if (!templates) return null
  const streams = nodes.some((node) => hasEventStreamContent(node) || isEventStream(node) || hasStreamVariant(node))
  const forms = [...new Set(nodes.flatMap(getFormContentTypes))].sort()
  const footer = buildClientFooter({ baseURL, forms, streams, servers, auth })
  return (
    <>
      {streams && <File baseName="sse.ts" path={path.resolve(root, '.kubb/sse.ts')} copy={path.join(templates, 'sse.ts')} />}
      {forms.map((contentType) => {
        const baseName = `${formMediaTypes[contentType].file}.ts` as const
        return (
          <File
            key={baseName}
            baseName={baseName}
            path={path.resolve(root, '.kubb/mediaTypes', baseName)}
            copy={path.join(templates, 'mediaTypes', baseName)}
          />
        )
      })}
      {footer && <File baseName="client.ts" path={path.resolve(root, '.kubb/client.ts')} footer={footer} />}
    </>
  )
}
