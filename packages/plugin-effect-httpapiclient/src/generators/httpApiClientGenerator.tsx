import path from 'node:path'
import { caseParams, getOperationParameters, getStatusCodeNumber, operationFileEntry, resolveContentTypeVariants } from '@internals/shared'
import { camelCase } from '@internals/utils'
import { pluginEffectName, type PluginEffect, type ResolverEffect } from '@kubb/plugin-effect'
import { ast, defineGenerator } from 'kubb/kit'
import { File, jsxRenderer } from 'kubb/jsx'
import { renderCookieRuntime } from '../cookieRuntime.ts'
import { renderParameterRuntime } from '../parameterRuntime.ts'
import { resolveOperationSecurity, type ResolvedOperationSecurity, type ResolvedSecurityScheme, type SecurityDocument } from '../security.ts'
import { renderSecurityRuntime, type SecurityOperation } from '../securityRuntime.ts'
import type { PluginEffectHttpApiClient } from '../types.ts'

type ContentNode = NonNullable<ast.ResponseNode['content']>[number]

type OperationData = {
  node: ast.HttpOperationNode
  endpointName: string
  endpointIdentifier: string
  endpointFile: ast.FileNode
  effectFile: ast.FileNode
  effectImports: Array<string>
  usesCookieCodec: boolean
  usesParameterCodec: boolean
  source: string
  security: ResolvedOperationSecurity | null
}

const methodConstructors: Record<string, string> = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch',
  DELETE: 'delete',
  HEAD: 'head',
  OPTIONS: 'options',
}

function quote(value: string): string {
  return JSON.stringify(value)
}

function unique<T>(items: Array<T>): Array<T> {
  return [...new Set(items)]
}

function indent(value: string, spaces = 2): string {
  const prefix = ' '.repeat(spaces)
  return value
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n')
}

function isJsonContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase()
  return normalized === 'application/json' || normalized.endsWith('+json')
}

function isXmlContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase()
  return normalized === 'application/xml' || normalized === 'text/xml' || normalized.endsWith('+xml')
}

function isTextContentType(contentType: string): boolean {
  return contentType.toLowerCase().startsWith('text/') || isXmlContentType(contentType)
}

function isStringSchema(schema: ast.SchemaNode | null | undefined): boolean {
  return schema?.type === 'string'
}

function payloadContentTypePriority(contentType: string): number {
  const normalized = contentType.toLowerCase()
  if (isJsonContentType(contentType)) return 0
  if (normalized === 'application/x-www-form-urlencoded') return 1
  if (normalized === 'multipart/form-data') return 2
  if (isTextContentType(contentType)) return 3
  if (normalized === 'application/octet-stream') return 4
  return 5
}

function contentSchemaNames({
  entries,
  baseName,
  useVariants,
}: {
  entries: Array<ContentNode>
  baseName: string
  useVariants: boolean
}): Map<ContentNode, string> {
  const names = new Map<ContentNode, string>()
  if (!useVariants) {
    const entry = entries.find((item) => item.schema)
    if (entry) names.set(entry, baseName)
    return names
  }

  const variants = resolveContentTypeVariants(entries, baseName)
  let variantIndex = 0
  for (const entry of entries) {
    if (!entry.schema) continue
    const variant = variants[variantIndex++]
    if (variant) names.set(entry, variant.name)
  }
  return names
}

function annotatedContentSchema({
  contentType,
  schema,
  schemaName,
  response,
}: {
  contentType: string
  schema: ast.SchemaNode | null | undefined
  schemaName: string | undefined
  response: boolean
}): { expression: string; importName: string | null } {
  const normalized = contentType.toLowerCase()
  if (response && normalized === 'text/event-stream') {
    const data = schemaName ?? (schema ? 'Schema.Unknown' : 'Schema.String')
    return {
      expression: `HttpApiSchema.StreamSse({ data: ${data}, contentType: ${quote(contentType)} })`,
      importName: schemaName ?? null,
    }
  }
  if (isJsonContentType(contentType)) {
    return {
      expression: `${schemaName ?? 'Schema.Unknown'}.pipe(HttpApiSchema.asJson({ contentType: ${quote(contentType)} }))`,
      importName: schemaName ?? null,
    }
  }
  if (normalized === 'application/x-www-form-urlencoded') {
    const value = schemaName ?? 'Schema.Record(Schema.String, Schema.String)'
    return {
      expression: `${value}.pipe(HttpApiSchema.asFormUrlEncoded({ contentType: ${quote(contentType)} }))`,
      importName: schemaName ?? null,
    }
  }
  if (!response && normalized === 'multipart/form-data') {
    return {
      expression: `${schemaName ?? 'Schema.Struct({})'}.pipe(HttpApiSchema.asMultipart())`,
      importName: schemaName ?? null,
    }
  }
  if (normalized === 'application/octet-stream' || !isTextContentType(contentType)) {
    return {
      expression: `Schema.Uint8Array.pipe(HttpApiSchema.asUint8Array({ contentType: ${quote(contentType)} }))`,
      importName: null,
    }
  }
  if (isXmlContentType(contentType) || !schemaName || !isStringSchema(schema)) {
    return {
      expression: `Schema.String.pipe(HttpApiSchema.asText({ contentType: ${quote(contentType)} }))`,
      importName: null,
    }
  }
  return {
    expression: `${schemaName}.pipe(HttpApiSchema.asText({ contentType: ${quote(contentType)} }))`,
    importName: schemaName,
  }
}

type ParameterLocation = 'path' | 'query' | 'header'

function parameterKind(schema: ast.SchemaNode): 'primitive' | 'array' | 'object' {
  const resolved = schema.type === 'ref' ? schema.schema : schema
  if (resolved?.type === 'array' || resolved?.type === 'tuple') return 'array'
  if (resolved?.type === 'object') return 'object'
  return 'primitive'
}

function parameterOptions({ param, location }: { param: ast.ParameterNode; location: ParameterLocation }): string {
  const defaults = {
    path: { style: 'simple', explode: false },
    query: { style: 'form', explode: true },
    header: { style: 'simple', explode: false },
  } as const
  const fallback = defaults[location]
  return JSON.stringify({
    name: param.name,
    kind: parameterKind(param.schema),
    style: param.style ?? fallback.style,
    explode: param.explode ?? fallback.explode,
  })
}

function renderParameterStruct({
  node,
  params,
  location,
  effectResolver,
}: {
  node: ast.HttpOperationNode
  params: Array<ast.ParameterNode>
  location: ParameterLocation
  effectResolver: ResolverEffect
}): {
  expression: string | null
  imports: Array<string>
} {
  if (!params.length) return { expression: null, imports: [] }
  const cased = caseParams(params, 'camelcase')
  const codec = `${location}Parameter`
  const fields = cased.map((param, index) => {
    const original = params[index]!
    const schema = `${codec}(${effectResolver.param.name(node, param)}, ${parameterOptions({ param: original, location })})`
    return `${quote(param.name)}: ${original.required ? schema : `Schema.optionalKey(${schema})`}`
  })
  const mapping = cased.flatMap((param, index) => {
    const original = params[index]
    if (!original || original.name === param.name) return []
    return [`${quote(param.name)}: ${quote(original.name)}`]
  })
  const struct = `Schema.Struct({\n${indent(fields.join(',\n'), 2)},\n})`
  return {
    expression: mapping.length ? `${struct}.pipe(Schema.encodeKeys({ ${mapping.join(', ')} }))` : struct,
    imports: cased.map((param) => effectResolver.param.name(node, param)),
  }
}

function renderHeadersStruct({
  node,
  headers,
  cookies,
  effectResolver,
}: {
  node: ast.HttpOperationNode
  headers: Array<ast.ParameterNode>
  cookies: Array<ast.ParameterNode>
  effectResolver: ResolverEffect
}): { expression: string | null; imports: Array<string>; usesCookieCodec: boolean } {
  if (!cookies.length) return { ...renderParameterStruct({ node, params: headers, location: 'header', effectResolver }), usesCookieCodec: false }

  const casedHeaders = caseParams(headers, 'camelcase')
  const casedCookies = caseParams(cookies, 'camelcase')
  if (casedHeaders.some((header) => header.name === 'cookies')) {
    throw new Error(`Operation "${node.operationId}" has a header parameter that conflicts with the generated headers.cookies field`)
  }

  const headerFields = casedHeaders.map((param, index) => {
    const schema = effectResolver.param.name(node, param)
    return `${quote(param.name)}: ${headers[index]?.required ? schema : `Schema.optionalKey(${schema})`}`
  })
  const cookieFields = casedCookies.map((param, index) => {
    const schema = effectResolver.param.name(node, param)
    return `${quote(param.name)}: ${cookies[index]?.required ? schema : `Schema.optionalKey(${schema})`}`
  })
  const cookieMapping = casedCookies.flatMap((param, index) => {
    const original = cookies[index]
    if (!original || original.name === param.name) return []
    return [`${quote(param.name)}: ${quote(original.name)}`]
  })
  let cookieStruct = `Schema.Struct({\n${indent(cookieFields.join(',\n'), 4)},\n  })`
  if (cookieMapping.length) cookieStruct += `.pipe(Schema.encodeKeys({ ${cookieMapping.join(', ')} }))`
  const cookiesField = cookies.some((param) => param.required) ? cookieStruct : `Schema.optionalKey(${cookieStruct})`
  const fields = [...headerFields, `${quote('cookies')}: ${cookiesField}`]
  let struct = `Schema.Struct({\n${indent(fields.join(',\n'), 2)},\n})`
  const headerMapping = casedHeaders.flatMap((param, index) => {
    const original = headers[index]
    if (!original || original.name === param.name) return []
    return [`${quote(param.name)}: ${quote(original.name)}`]
  })
  if (headerMapping.length) struct += `.pipe(Schema.encodeKeys({ ${headerMapping.join(', ')} }))`
  const parameters = [
    ...headers.map((param) => ({ name: param.name, location: 'header', explode: param.explode ?? false })),
    ...cookies.map((param) => ({ name: param.name, location: 'cookie', explode: param.explode ?? true })),
  ]

  return {
    expression: `headersWithCookies(${struct}, ${JSON.stringify(parameters)})`,
    imports: [...casedHeaders, ...casedCookies].map((param) => effectResolver.param.name(node, param)),
    usesCookieCodec: true,
  }
}

function renderResponses({ node, effectResolver }: { node: ast.HttpOperationNode; effectResolver: ResolverEffect }): {
  success: Array<string>
  error: Array<string>
  imports: Array<string>
} {
  const success: Array<string> = []
  const error: Array<string> = []
  const imports: Array<string> = []

  for (const response of node.responses) {
    const status = getStatusCodeNumber(response.statusCode)
    if (status === null) throw new Error(`Operation "${node.operationId}" uses unsupported non-numeric response status "${response.statusCode}"`)
    const target = status >= 200 && status < 300 ? success : error
    const entries = response.content ?? []
    if (!entries.length) {
      target.push(`HttpApiSchema.Empty(${status})`)
      continue
    }

    const entriesWithSchema = entries.filter((entry) => entry.schema)
    const baseName = effectResolver.response.status(node, response.statusCode)
    const names = contentSchemaNames({ entries, baseName, useVariants: entriesWithSchema.length > 1 })
    for (const entry of entries) {
      const content = annotatedContentSchema({
        contentType: entry.contentType,
        schema: entry.schema,
        schemaName: names.get(entry),
        response: true,
      })
      if (content.importName) imports.push(content.importName)
      target.push(`${content.expression}.pipe(HttpApiSchema.status(${status}))`)
    }
  }

  return { success, error, imports: unique(imports) }
}

function renderPayload({ node, effectResolver }: { node: ast.HttpOperationNode; effectResolver: ResolverEffect }): {
  expression: string | null
  imports: Array<string>
} {
  const entries = node.requestBody?.content ?? []
  if (!entries.length) return { expression: null, imports: [] }

  const baseName = effectResolver.response.body(node)
  const names = contentSchemaNames({ entries, baseName, useVariants: entries.length > 1 })
  const imports: Array<string> = []
  const orderedEntries = [...entries].sort((left, right) => payloadContentTypePriority(left.contentType) - payloadContentTypePriority(right.contentType))
  const expressions = orderedEntries.map((entry) => {
    const content = annotatedContentSchema({
      contentType: entry.contentType,
      schema: entry.schema,
      schemaName: names.get(entry),
      response: false,
    })
    if (content.importName) imports.push(content.importName)
    return content.expression
  })
  return {
    expression: expressions.length === 1 ? expressions[0]! : `[${expressions.join(', ')}]`,
    imports: unique(imports),
  }
}

function renderEndpointAnnotations({ node, security }: { node: ast.HttpOperationNode; security: ResolvedOperationSecurity | null }): string | null {
  const fields: Array<string> = []
  if (node.summary) fields.push(`summary: ${quote(node.summary)}`)
  if (node.description) fields.push(`description: ${quote(node.description)}`)
  if (node.deprecated !== undefined) fields.push(`deprecated: ${node.deprecated}`)
  if (security) {
    const requirements = security.requirements.map((alternative) => Object.fromEntries(alternative.map((entry) => [entry.name, entry.scopes])))
    fields.push(`override: { security: ${JSON.stringify(requirements)} }`)
  }
  return fields.length ? `OpenApi.annotations({ ${fields.join(', ')} })` : null
}

function renderEndpointSource({
  node,
  endpointName,
  endpointIdentifier,
  effectResolver,
  security,
}: {
  node: ast.HttpOperationNode
  endpointName: string
  endpointIdentifier: string
  effectResolver: ResolverEffect
  security: ResolvedOperationSecurity | null
}): { source: string; imports: Array<string>; usesCookieCodec: boolean; usesParameterCodec: boolean } {
  const method = methodConstructors[node.method.toUpperCase()]
  if (!method) throw new Error(`Operation "${node.operationId}" uses unsupported HTTP method "${node.method.toUpperCase()}"`)

  const parameters = getOperationParameters(node, { paramsCasing: 'original' })
  const params = renderParameterStruct({ node, params: parameters.path, location: 'path', effectResolver })
  const query = renderParameterStruct({ node, params: parameters.query, location: 'query', effectResolver })
  const headers = renderHeadersStruct({ node, headers: parameters.header, cookies: parameters.cookie, effectResolver })
  const payload = renderPayload({ node, effectResolver })
  const responses = renderResponses({ node, effectResolver })
  const options: Array<string> = []
  if (params.expression) options.push(`params: ${params.expression}`)
  if (query.expression) options.push(`query: ${query.expression}`)
  if (headers.expression) options.push(`headers: ${headers.expression}`)
  if (payload.expression) options.push(`payload: ${payload.expression}`)
  if (responses.success.length) options.push(`success: [${responses.success.join(', ')}]`)
  if (responses.error.length) options.push(`error: [${responses.error.join(', ')}]`)

  const path = node.path.replaceAll(/\{([^}]+)\}/g, ':$1')
  let expression = `HttpApiEndpoint.${method}(${quote(endpointIdentifier)}, ${quote(path)}, {\n${indent(options.join(',\n'), 2)},\n})`
  if (security) expression += '.middleware(ApiSecurity)'
  const annotations = renderEndpointAnnotations({ node, security })
  if (annotations) expression += `.annotateMerge(${annotations})`

  return {
    source: `/**\n * ${node.summary ?? `HttpApi endpoint for ${node.method.toUpperCase()} ${node.path}.`}\n */\nexport const ${endpointName} = ${expression}\n`,
    imports: unique([...params.imports, ...query.imports, ...headers.imports, ...payload.imports, ...responses.imports]),
    usesCookieCodec: headers.usesCookieCodec,
    usesParameterCodec: parameters.path.length > 0 || parameters.query.length > 0 || (parameters.header.length > 0 && parameters.cookie.length === 0),
  }
}

function renderApiSource({
  operations,
  mode,
  apiName,
  groupName,
  groupIdentifier,
  title,
  version,
  description,
}: {
  operations: Array<OperationData>
  mode: 'tag' | 'flat'
  apiName: string
  groupName(tag: string): string
  groupIdentifier(tag: string): string
  title: string | undefined
  version: string | undefined
  description: string | undefined
}): string {
  const grouped = new Map<string, Array<OperationData>>()
  for (const operation of operations) {
    const tag = operation.node.tags[0] ?? 'default'
    const existing = grouped.get(tag)
    if (existing) existing.push(operation)
    else grouped.set(tag, [operation])
  }

  const groups = [...grouped.entries()].map(([tag, entries]) => {
    const name = groupName(tag)
    const identifier = groupIdentifier(tag)
    const options = mode === 'flat' ? ', { topLevel: true }' : ''
    const additions = entries.map((entry) => `.add(${entry.endpointName})`).join('')
    return `/**\n * HttpApi group for the ${tag} operations.\n */\nexport const ${name} = HttpApiGroup.make(${quote(identifier)}${options})${additions}`
  })
  const apiAdditions = [...grouped.keys()].map((tag) => `.add(${groupName(tag)})`).join('')
  const annotationFields = [
    title ? `title: ${quote(title)}` : null,
    version ? `version: ${quote(version)}` : null,
    description ? `description: ${quote(description)}` : null,
  ].filter((field): field is string => Boolean(field))
  const annotations = annotationFields.length ? `.annotateMerge(OpenApi.annotations({ ${annotationFields.join(', ')} }))` : ''
  return `${groups.join('\n\n')}\n\n/**\n * Root Effect HttpApi contract.\n */\nexport const ${apiName} = HttpApi.make(${quote(camelCase(title ?? 'api'))})${apiAdditions}${annotations}\n`
}

function renderClientSource({ apiName, clientName, baseURL }: { apiName: string; clientName: string; baseURL: string | undefined }): string {
  const options = baseURL ? `, { baseUrl: ${quote(baseURL)} }` : ''
  return `/**\n * Client methods derived from the generated HttpApi contract.\n */\nexport type ${clientName} = HttpApiClient.ForApi<typeof ${apiName}>\n\n/**\n * Effect that constructs the generated HttpApi client.\n */\nexport const ${clientName} = HttpApiClient.make(${apiName}${options})\n`
}

function relativeModulePath({ from, to }: { from: string; to: string }): string {
  const relative = path
    .relative(path.dirname(from), to)
    .replaceAll(path.sep, '/')
    .replace(/\.[^.]+$/, '')
  return relative.startsWith('.') ? relative : `./${relative}`
}

/**
 * Generates Effect HttpApi endpoints, groups, the root API, the fixed client Effect, and security middleware.
 */
export const httpApiClientGenerator = defineGenerator<PluginEffectHttpApiClient>({
  name: 'effect-httpapiclient',
  renderer: jsxRenderer,
  operations(nodes, ctx) {
    const { config, driver, resolver, root } = ctx
    const { output, group, mode, baseURL } = ctx.options
    const pluginEffect = driver.getPlugin(pluginEffectName)
    if (!pluginEffect) return null

    const effectResolver = driver.getResolver(pluginEffectName)
    const effectOptions = pluginEffect.options as PluginEffect['resolvedOptions'] | undefined
    const effectOutput = effectOptions?.output ?? output
    const effectGroup = effectOptions?.group ?? undefined
    const securityDocument = ctx.adapter.document as SecurityDocument | null | undefined
    const securityFile = resolver.file({ name: 'security', extname: '.ts', root, output, group: group ?? undefined })
    const cookieFile = resolver.file({ name: 'cookieParameters', extname: '.ts', root, output, group: group ?? undefined })
    const parameterFile = resolver.file({ name: 'parameterSerialization', extname: '.ts', root, output, group: group ?? undefined })

    const operations = nodes.filter(ast.isHttpOperationNode).map((node): OperationData => {
      const endpointName = resolver.endpoint.name(node)
      const endpointIdentifier = resolver.endpoint.identifier(node)
      const endpointFile = resolver.file({
        ...operationFileEntry(node, `${node.operationId}Endpoint`),
        root,
        output,
        group: group ?? undefined,
      })
      const effectFile = effectResolver.file({
        ...operationFileEntry(node, node.operationId),
        root,
        output: effectOutput,
        group: effectGroup,
      })
      const security = resolveOperationSecurity({ document: securityDocument, method: node.method, path: node.path })
      const rendered = renderEndpointSource({ node, endpointName, endpointIdentifier, effectResolver, security })
      return {
        node,
        endpointName,
        endpointIdentifier,
        endpointFile,
        effectFile,
        effectImports: rendered.imports,
        usesCookieCodec: rendered.usesCookieCodec,
        usesParameterCodec: rendered.usesParameterCodec,
        source: rendered.source,
        security,
      }
    })

    const endpointIdentifiers = new Set<string>()
    for (const operation of operations) {
      if (endpointIdentifiers.has(operation.endpointIdentifier)) {
        throw new Error(`Duplicate Effect HttpApi endpoint identifier "${operation.endpointIdentifier}"`)
      }
      endpointIdentifiers.add(operation.endpointIdentifier)
    }

    const apiFile = resolver.file({ name: 'api', extname: '.ts', root, output, group: group ?? undefined })
    const clientFile = resolver.file({ name: 'apiClient', extname: '.ts', root, output, group: group ?? undefined })
    const indexFile = resolver.file({ name: 'index', extname: '.ts', root, output, group: group ?? undefined })
    const apiName = resolver.api.name()
    const clientName = resolver.client.name()
    const securityOperations: Array<SecurityOperation> = operations.flatMap((operation) =>
      operation.security ? [{ identifier: operation.endpointIdentifier, requirements: operation.security.requirements }] : [],
    )
    const schemes = new Map<string, ResolvedSecurityScheme>()
    for (const operation of operations) {
      for (const scheme of operation.security?.schemes ?? []) schemes.set(scheme.name, scheme)
    }

    const banner = (file: ast.FileNode) => resolver.default.banner(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })
    const footer = (file: ast.FileNode) => resolver.default.footer(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })

    return (
      <>
        {operations.map((operation) => (
          <File
            key={operation.endpointFile.path}
            baseName={operation.endpointFile.baseName}
            path={operation.endpointFile.path}
            meta={operation.endpointFile.meta}
            banner={banner(operation.endpointFile)}
            footer={footer(operation.endpointFile)}
          >
            {/(^|\W)Schema\./.test(operation.source) && <File.Import name="Schema" path="effect/Schema" isNameSpace />}
            <File.Import name={['HttpApiEndpoint', 'HttpApiSchema', 'OpenApi']} path="effect/unstable/httpapi" />
            {operation.effectImports.length > 0 && (
              <File.Import name={operation.effectImports} root={operation.endpointFile.path} path={operation.effectFile.path} />
            )}
            {operation.usesCookieCodec && <File.Import name={['headersWithCookies']} root={operation.endpointFile.path} path={cookieFile.path} />}
            {operation.usesParameterCodec && (
              <File.Import name={['headerParameter', 'pathParameter', 'queryParameter']} root={operation.endpointFile.path} path={parameterFile.path} />
            )}
            {operation.security && <File.Import name={['ApiSecurity']} root={operation.endpointFile.path} path={securityFile.path} />}
            <File.Source name={operation.endpointName}>{operation.source}</File.Source>
          </File>
        ))}

        <File baseName={apiFile.baseName} path={apiFile.path} meta={apiFile.meta} banner={banner(apiFile)} footer={footer(apiFile)}>
          <File.Import name={['HttpApi', 'HttpApiGroup', 'OpenApi']} path="effect/unstable/httpapi" />
          {operations.map((operation) => (
            <File.Import key={operation.endpointIdentifier} name={[operation.endpointName]} root={apiFile.path} path={operation.endpointFile.path} />
          ))}
          <File.Source name={apiName}>
            {renderApiSource({
              operations,
              mode,
              apiName,
              groupName: resolver.group.name.bind(resolver.group),
              groupIdentifier: resolver.group.identifier.bind(resolver.group),
              title: ctx.meta.title,
              version: ctx.meta.version,
              description: ctx.meta.description,
            })}
          </File.Source>
        </File>

        <File baseName={clientFile.baseName} path={clientFile.path} meta={clientFile.meta} banner={banner(clientFile)} footer={footer(clientFile)}>
          <File.Import name={['HttpApiClient']} path="effect/unstable/httpapi" />
          <File.Import name={[apiName]} root={clientFile.path} path={apiFile.path} />
          <File.Source name={clientName}>{renderClientSource({ apiName, clientName, baseURL })}</File.Source>
        </File>

        {securityOperations.length > 0 && (
          <File baseName={securityFile.baseName} path={securityFile.path} meta={securityFile.meta} banner={banner(securityFile)} footer={footer(securityFile)}>
            <File.Import name={['Data', 'Effect', 'Redacted']} path="effect" />
            <File.Import name={['HttpClientRequest']} path="effect/unstable/http" />
            <File.Import name={['HttpApiMiddleware']} path="effect/unstable/httpapi" />
            <File.Source name="security">{renderSecurityRuntime({ operations: securityOperations, schemes: [...schemes.values()] })}</File.Source>
          </File>
        )}

        {operations.some((operation) => operation.usesCookieCodec) && (
          <File baseName={cookieFile.baseName} path={cookieFile.path} meta={cookieFile.meta} banner={banner(cookieFile)} footer={footer(cookieFile)}>
            <File.Import name={['Effect', 'Option', 'SchemaGetter', 'SchemaIssue']} path="effect" />
            <File.Import name="Schema" path="effect/Schema" isNameSpace />
            <File.Import name={['Cookies']} path="effect/unstable/http" />
            <File.Source name="cookieParameters">{renderCookieRuntime()}</File.Source>
          </File>
        )}

        {operations.some((operation) => operation.usesParameterCodec) && (
          <File
            baseName={parameterFile.baseName}
            path={parameterFile.path}
            meta={parameterFile.meta}
            banner={banner(parameterFile)}
            footer={footer(parameterFile)}
          >
            <File.Import name={['Effect', 'Option', 'SchemaGetter', 'SchemaIssue']} path="effect" />
            <File.Import name="Schema" path="effect/Schema" isNameSpace />
            <File.Source name="parameterSerialization">{renderParameterRuntime()}</File.Source>
          </File>
        )}

        {indexFile.path !== apiFile.path && (
          <File baseName={indexFile.baseName} path={indexFile.path} meta={indexFile.meta} banner={banner(indexFile)} footer={footer(indexFile)}>
            <File.Source name="index">
              {[
                `export * from ${quote(relativeModulePath({ from: indexFile.path, to: apiFile.path }))}`,
                `export * from ${quote(relativeModulePath({ from: indexFile.path, to: clientFile.path }))}`,
                ...operations.map((operation) => `export * from ${quote(relativeModulePath({ from: indexFile.path, to: operation.endpointFile.path }))}`),
                ...(securityOperations.length ? [`export * from ${quote(relativeModulePath({ from: indexFile.path, to: securityFile.path }))}`] : []),
              ].join('\n')}
            </File.Source>
          </File>
        )}
      </>
    )
  },
})
