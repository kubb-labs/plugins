import { collectRefNames, getOasAdapter, getOperationParameters, getSuccessResponses, isSuccessStatusCode, resolveContentTypeVariants } from '@internals/shared'
import { ast, defineGenerator } from 'kubb/kit'
import { File, jsxRenderer } from 'kubb/jsx'
import { Zod } from '../components/Zod.tsx'
import { ZOD_NAMESPACE_IMPORTS } from '../constants.ts'
import { printerZod } from '../printers/printerZod.ts'
import { printerZodMini } from '../printers/printerZodMini.ts'
import type { PluginZod, ResolverZod } from '../types'
import { buildGroupedParamsSchema, buildOptionsSchema, collectCodecRefNames, containsCodec } from '../utils.ts'

type StdPrinters = { output: ReturnType<typeof printerZod>; input: ReturnType<typeof printerZod> }
type ZodPrinterEntry = StdPrinters & { coercion: unknown; guidType: unknown; regexType: unknown; dateType: unknown; nodes: unknown }
type ZodMiniPrinterEntry = { printer: ReturnType<typeof printerZodMini>; guidType: unknown; regexType: unknown; nodes: unknown }

// Per-build caches: keyed on resolver (unique per plugin instance per build, GC'd when released)
const zodPrinterCache = new WeakMap<ResolverZod, ZodPrinterEntry>()
const zodMiniPrinterCache = new WeakMap<ResolverZod, ZodMiniPrinterEntry>()

type StdPrinterParams = {
  coercion: unknown
  guidType: unknown
  regexType: unknown
  dateType: unknown
  cyclicSchemas: ReadonlySet<string>
  nodes: unknown
}

type BuildResponseUnionParams = {
  responses: Array<ast.ResponseNode>
  name: string
  fallbackUnknown: boolean
}

/**
 * Returns the cached `output`/`input` direction printers for a resolver, building them on
 * first use. The `input` printer encodes `Date → string` for request bodies, and `output` decodes
 * `string → Date` for responses. Schemas without `dateType: 'date'` fields print identically.
 */
function getStdPrinters(resolver: ResolverZod, params: StdPrinterParams): StdPrinters {
  const cached = zodPrinterCache.get(resolver)
  if (
    cached &&
    cached.coercion === params.coercion &&
    cached.guidType === params.guidType &&
    cached.regexType === params.regexType &&
    cached.dateType === params.dateType &&
    cached.nodes === params.nodes
  ) {
    return { output: cached.output, input: cached.input }
  }
  const output = printerZod({ ...params, resolver, direction: 'output' } as Parameters<typeof printerZod>[0])
  const input = printerZod({ ...params, resolver, direction: 'input' } as Parameters<typeof printerZod>[0])
  zodPrinterCache.set(resolver, {
    output,
    input,
    coercion: params.coercion,
    guidType: params.guidType,
    regexType: params.regexType,
    dateType: params.dateType,
    nodes: params.nodes,
  })
  return { output, input }
}

function getMiniPrinter(
  resolver: ResolverZod,
  params: {
    guidType: unknown
    regexType: unknown
    cyclicSchemas: ReadonlySet<string>
    nodes: unknown
  },
) {
  const cached = zodMiniPrinterCache.get(resolver)
  if (cached && cached.guidType === params.guidType && cached.regexType === params.regexType && cached.nodes === params.nodes) return cached.printer
  const p = printerZodMini({ ...params, resolver } as Parameters<typeof printerZodMini>[0])
  zodMiniPrinterCache.set(resolver, { printer: p, guidType: params.guidType, regexType: params.regexType, nodes: params.nodes })
  return p
}

/**
 * Built-in generator for `@kubb/plugin-zod`. Emits one Zod schema per
 * schema in the spec plus per-operation request/response/parameter schemas.
 * When `mini: true`, schemas use the Zod Mini functional API instead of
 * chainable methods.
 */
export const zodGenerator = defineGenerator<PluginZod>({
  name: 'zod',
  renderer: jsxRenderer,
  schema(node, ctx) {
    const { adapter, config, resolver, root } = ctx
    const { output, coercion, guidType, regexType, mini, inferred, importPath, group, printer } = ctx.options
    const dateType = getOasAdapter(adapter).options.dateType

    if (!node.name) {
      return
    }

    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')
    const cyclicSchemas = new Set<string>(ctx.meta.circularNames)

    // A codec component is rendered twice: the canonical (output) schema decodes
    // `string → Date`, and an `${name}InputSchema` variant encodes `Date → string` for requests.
    const hasCodec = !mini && containsCodec(node)

    const codecRefNames = new Set(hasCodec ? collectCodecRefNames(node) : [])
    const importEntries = resolver.imports({ node, root, output, group: group ?? undefined })
    const inputImportEntries = hasCodec
      ? [...codecRefNames].map((schemaName) => ({
          name: [resolver.schema.inputName(schemaName)],
          path: resolver.file({ name: schemaName, extname: '.ts', root, output, group: group ?? undefined }).path,
        }))
      : []
    const seenImports = new Set<string>()
    const imports = [...importEntries, ...inputImportEntries].filter((imp) => {
      const key = `${Array.isArray(imp.name) ? imp.name.join(',') : imp.name}|${imp.path}`
      if (seenImports.has(key)) return false
      seenImports.add(key)
      return true
    })

    const meta = {
      name: resolver.name(node.name),
      file: resolver.file({ name: node.name, extname: '.ts', root, output, group: group ?? undefined }),
    } as const

    const inferTypeName = inferred ? resolver.schema.typeName(node.name) : null

    const stdPrinters = mini ? null : getStdPrinters(resolver, { coercion, guidType, regexType, dateType, cyclicSchemas, nodes: printer?.nodes })
    const schemaPrinter = mini ? getMiniPrinter(resolver, { guidType, regexType, cyclicSchemas, nodes: printer?.nodes }) : stdPrinters!.output

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {imports.map((imp) => (
          <File.Import key={[node.name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
        ))}

        <Zod name={meta.name} node={node} printer={schemaPrinter} inferTypeName={inferTypeName} cyclic={cyclicSchemas.has(node.name)} />
        {hasCodec && stdPrinters && (
          <Zod
            name={resolver.schema.inputName(node.name)}
            node={node}
            printer={stdPrinters.input}
            inferTypeName={inferred ? resolver.schema.inputTypeName(node.name) : null}
            cyclic={cyclicSchemas.has(node.name)}
          />
        )}
      </File>
    )
  },
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { adapter, config, resolver, root } = ctx
    const { output, coercion, guidType, regexType, mini, inferred, importPath, group, printer } = ctx.options
    const dateType = getOasAdapter(adapter).options.dateType

    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const meta = {
      file: resolver.file({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path, root, output, group: group ?? undefined }),
    } as const

    const cyclicSchemas = new Set<string>(ctx.meta.circularNames)

    function renderSchemaEntry({
      schema,
      name,
      keysToOmit,
      direction = 'output',
    }: {
      schema: ast.SchemaNode | null
      name: string
      keysToOmit?: Array<string> | null
      direction?: 'input' | 'output'
    }) {
      if (!schema) return null

      const inferTypeName = inferred ? resolver.schema.type(name) : null

      // In the input direction, refs to codec components resolve to their input variant.
      const codecRefNames = direction === 'input' && !mini ? new Set(collectCodecRefNames(schema)) : null
      const imports = resolver.imports({
        node: schema,
        root,
        output,
        group: group ?? undefined,
        name: (schemaName) => (codecRefNames?.has(schemaName) ? resolver.schema.inputName(schemaName) : resolver.name(schemaName)),
      })

      const schemaPrinter = mini
        ? keysToOmit?.length
          ? printerZodMini({ guidType, regexType, resolver, keysToOmit, cyclicSchemas, nodes: printer?.nodes })
          : getMiniPrinter(resolver, { guidType, regexType, cyclicSchemas, nodes: printer?.nodes })
        : keysToOmit?.length
          ? printerZod({
              coercion,
              guidType,
              regexType,
              dateType,
              resolver,
              keysToOmit,
              cyclicSchemas,
              nodes: printer?.nodes,
              direction,
            })
          : getStdPrinters(resolver, { coercion, guidType, regexType, dateType, cyclicSchemas, nodes: printer?.nodes })[direction]

      return (
        <>
          {imports.map((imp) => (
            <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
          ))}
          {/* Operation schemas reference (and import) the component schemas, which carry the
              `z.ZodType` annotation at their own definition when cyclic. Annotating the operation
              schema too would only erase its inferred type to `unknown`, breaking typed consumers
              (e.g. the MCP server's request types), so it is never marked cyclic here. */}
          <Zod name={name} node={schema} printer={schemaPrinter} inferTypeName={inferTypeName} cyclic={false} />
        </>
      )
    }

    // Multiple content types for a single name: emit one schema per content type plus a union alias.
    function buildContentTypeVariants(
      entries: Array<{ contentType: string; schema?: ast.SchemaNode | null; keysToOmit?: Array<string> | null }>,
      baseName: string,
      decorate?: (schema: ast.SchemaNode) => ast.SchemaNode,
      direction?: 'input' | 'output',
    ) {
      const variants = resolveContentTypeVariants(entries, baseName)
      const unionSchema = ast.factory.createSchema({
        type: 'union',
        members: variants.map((variant) => ast.factory.createSchema({ type: 'ref', name: variant.name })),
      })
      return (
        <>
          {variants.map((variant) =>
            renderSchemaEntry({
              schema: decorate ? decorate(variant.schema) : variant.schema,
              name: variant.name,
              keysToOmit: variant.keysToOmit,
              direction,
            }),
          )}
          {renderSchemaEntry({ schema: unionSchema, name: baseName, direction })}
        </>
      )
    }

    // Builds a response/error union schema: one schema per member response, aliased under `name`.
    function buildResponseUnion({ responses, name, fallbackUnknown }: BuildResponseUnionParams) {
      // Collect import names from the response schemas to detect naming collisions. When a response
      // is a $ref to a component schema whose resolved name matches `name`, skip generation to avoid
      // redeclaration errors.
      const importedNames = new Set(
        responses.flatMap((res) =>
          (res.content ?? []).flatMap((entry) => (entry.schema ? collectRefNames(entry.schema).map((refName) => resolver.name(refName)) : [])),
        ),
      )

      if (importedNames.has(name)) {
        return null
      }

      const members = responses.map((res) => ast.factory.createSchema({ type: 'ref', name: resolver.response.status(node, res.statusCode) }))

      // No documented schema: fall back to an unknown schema so the name still resolves for
      // consumers that parse those bodies.
      if (fallbackUnknown && members.length === 0) {
        return renderSchemaEntry({ schema: ast.factory.createSchema({ type: 'unknown' }), name })
      }

      const unionNode = members.length === 1 ? members[0]! : ast.factory.createSchema({ type: 'union', members })

      return renderSchemaEntry({
        schema: unionNode,
        name,
      })
    }

    const paramSchemas = node.parameters.map((param) => renderSchemaEntry({ schema: param.schema, name: resolver.param.name(node, param), direction: 'input' }))

    const responseSchemas = node.responses.map((res) => {
      const variants = (res.content ?? []).filter((entry) => entry.schema)
      if (variants.length > 1) {
        return buildContentTypeVariants(res.content!, resolver.response.status(node, res.statusCode))
      }
      const primary = variants[0] ?? res.content?.[0]
      return renderSchemaEntry({
        schema: primary?.schema ?? null,
        name: resolver.response.status(node, res.statusCode),
        keysToOmit: primary?.keysToOmit,
      })
    })

    const responsesWithSchema = node.responses.filter((res) => res.content?.some((entry) => entry.schema))
    // Validate success (2xx) bodies only. Error bodies are surfaced unparsed, typed by plugin-ts (#369).
    const successResponsesWithSchema = getSuccessResponses(responsesWithSchema)
    const responseUnionSchema =
      responsesWithSchema.length > 0
        ? buildResponseUnion({ responses: successResponsesWithSchema, name: resolver.response.response(node), fallbackUnknown: true })
        : null

    // Validate error bodies on the non-throw path. Mirrors the success union but selects every
    // non-2xx response (including the OpenAPI `default`) so it lines up with plugin-ts `ErrorOf` (#369).
    const errorResponsesWithSchema = responsesWithSchema.filter((res) => !isSuccessStatusCode(res.statusCode))
    const errorUnionSchema =
      errorResponsesWithSchema.length > 0
        ? buildResponseUnion({ responses: errorResponsesWithSchema, name: resolver.response.error(node), fallbackUnknown: false })
        : null

    const requestBodyContent = node.requestBody?.content ?? []
    const requestSchema = (() => {
      if (requestBodyContent.length === 0) return null
      if (requestBodyContent.length === 1) {
        const entry = requestBodyContent[0]!
        if (!entry.schema) return null
        return renderSchemaEntry({
          schema: { ...entry.schema, description: node.requestBody!.description ?? entry.schema.description },
          name: resolver.response.body(node),
          keysToOmit: entry.keysToOmit,
          direction: 'input',
        })
      }
      return buildContentTypeVariants(
        requestBodyContent,
        resolver.response.body(node),
        (schema) => ({
          ...schema,
          description: node.requestBody!.description ?? schema.description,
        }),
        'input',
      )
    })()

    // Grouped path/query/headers schemas plus the combined `{ body, path, query, headers }` options
    // schema exist only to back `resolver.response.options(node)` for consumers sourcing types from
    // this plugin instead of `plugin-ts`. Not worth generating when nothing will import them.
    const { path: pathParams, query: queryParams, header: headerParams } = getOperationParameters(node)

    const paramGroupSchemas = inferred
      ? [
          pathParams.length > 0 &&
            renderSchemaEntry({
              schema: buildGroupedParamsSchema({ params: pathParams }),
              name: resolver.param.path(node, pathParams[0]!),
              direction: 'input',
            }),
          queryParams.length > 0 &&
            renderSchemaEntry({
              schema: buildGroupedParamsSchema({ params: queryParams }),
              name: resolver.param.query(node, queryParams[0]!),
              direction: 'input',
            }),
          headerParams.length > 0 &&
            renderSchemaEntry({
              schema: buildGroupedParamsSchema({ params: headerParams }),
              name: resolver.param.headers(node, headerParams[0]!),
              direction: 'input',
            }),
        ]
      : []

    const optionsSchema = inferred
      ? renderSchemaEntry({ schema: buildOptionsSchema(node, { resolver }), name: resolver.name(`${node.operationId} Options`), direction: 'input' })
      : null

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {paramSchemas}
        {responseSchemas}
        {responseUnionSchema}
        {errorUnionSchema}
        {requestSchema}
        {paramGroupSchemas}
        {optionsSchema}
      </File>
    )
  },
})
