import path from 'node:path'
import { getFormContentTypes, hasEventStreamContent, hasStreamVariant, isEventStream } from '@internals/shared'

import { ast, code } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import { buildSecuritySchemes } from '../builders/security.ts'
import { hasQueryStyles } from '../builders/styles.ts'
import type { KubbReactNode } from '@kubb/renderer-jsx'

function buildServersExport(servers: Array<ast.InputServer> | undefined): string | null {
  const named = ast.server.byName(servers)
  if (!named.size) return null
  const entries = [...named].map(([name, { url }]) => `${code.key(name)}: ${code.string(url)}`)
  return `/**\n * The servers from the spec by name, for \`baseURL\`.\n */\nexport const servers = { ${entries.join(', ')} } as const`
}

// The form media types, each in its own file under `templates/mediaTypes/`, so a document ships only the ones it uses.
const formMediaTypes = {
  'multipart/form-data': { file: 'mediaTypes/formData', name: 'multipartFormData' },
  'application/x-www-form-urlencoded': { file: 'mediaTypes/urlencoded', name: 'urlencoded' },
} as const

/**
 * Writes the runtime a document needs into `.kubb/`: the optional media type, serializer and `sse.ts` files, and a
 * `config.ts` that imports them, which `client.ts` passes to `setConfig`. The footer of `client.ts` gets the named
 * `servers` and `securitySchemes` and the `sse.ts` re-export. `templates` is the folder the runtime is copied from, set
 * by the plugins that ship it, so a custom client from `@kubb/plugin-client` gets none of this.
 */
export function ClientRuntime({
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
  const hasParameter = (match: (parameter: ast.ParameterNode) => boolean) => nodes.some((node) => node.parameters.some(match))
  const streams = nodes.some((node) => hasEventStreamContent(node) || isEventStream(node) || hasStreamVariant(node))
  const forms = [...new Set(nodes.flatMap(getFormContentTypes))].sort().map((contentType) => ({ contentType, ...formMediaTypes[contentType] }))
  const queryStyles = nodes.some(hasQueryStyles)

  const serializers = [
    queryStyles
      ? { key: 'query', file: 'serializers/queryStyles', name: 'serializeStyledQuery' }
      : { key: 'query', file: 'serializers/query', name: 'serializeQuery' },
    hasParameter((parameter) => parameter.in === 'path' && (parameter.style === 'label' || parameter.style === 'matrix'))
      ? { key: 'path', file: 'serializers/pathStyles', name: 'serializeStyledPath' }
      : { key: 'path', file: 'serializers/path', name: 'serializePath' },
    hasParameter((parameter) => parameter.in === 'header') ? { key: 'header', file: 'serializers/headers', name: 'serializeHeaders' } : null,
    hasParameter((parameter) => parameter.in === 'cookie') ? { key: 'cookie', file: 'serializers/cookies', name: 'serializeCookies' } : null,
  ].filter((serializer) => serializer !== null)
  const imports = [...forms, ...(streams ? [{ file: 'sse', name: 'streamMediaTypes' }] : []), ...serializers]
  // `pathStyles.ts` builds on `path.ts`, and the urlencoded media type on `queryStyles.ts`.
  const files = new Set([
    ...imports.map(({ file }) => file),
    'serializers/path',
    ...(forms.some(({ name }) => name === 'urlencoded') ? ['serializers/queryStyles'] : []),
  ])

  const baseURLExpression = baseURL ? (baseURL.includes('${') ? `\`${baseURL.replaceAll('`', '\\`')}\`` : JSON.stringify(baseURL)) : undefined
  const mediaTypes = [...forms.map(({ contentType, name }) => `'${contentType}': ${name}`), streams ? '...streamMediaTypes' : null].filter(Boolean)
  const config = [
    baseURLExpression ? `baseURL: ${baseURLExpression}` : null,
    mediaTypes.length ? `mediaTypes: { ${mediaTypes.join(', ')} }` : null,
    `serializer: { ${serializers.map(({ key, name }) => `${key}: ${name}`).join(', ')} }`,
  ].filter(Boolean)
  const footer = [buildServersExport(servers), buildSecuritySchemes(auth), streams ? `export * from './sse.ts'` : null].filter(Boolean).join('\n')
  const configPath = path.resolve(root, '.kubb/config.ts')
  const runtimePath = (file: string) => path.resolve(root, '.kubb', `${file}.ts`)

  return (
    <>
      {[...files].map((file) => (
        <File key={file} baseName={`${path.basename(file)}.ts`} path={runtimePath(file)} copy={path.join(templates, `${file}.ts`)} />
      ))}
      <File baseName="config.ts" path={configPath}>
        {imports.map(({ file, name }) => (
          <File.Import key={name} name={[name]} root={configPath} path={runtimePath(file)} />
        ))}
        <File.Import name={['ClientConfig']} root={configPath} path={runtimePath('core')} isTypeOnly />
        <File.Source name="defaultConfig" isExportable>
          {`/**\n * The config \`client.ts\` starts with: what this spec needs from the runtime.\n */\nexport const defaultConfig: ClientConfig = { ${config.join(', ')} }`}
        </File.Source>
      </File>
      {footer && <File baseName="client.ts" path={path.resolve(root, '.kubb/client.ts')} footer={footer} />}
    </>
  )
}
