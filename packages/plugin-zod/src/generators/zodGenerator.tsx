import {
  buildOptionsSchema,
  buildResponses,
  getOasAdapter,
  getOperationParameters,
  getSuccessResponses,
  isSuccessStatusCode,
  resolveContentTypeVariants,
} from '@internals/shared'
import { ast, defineGenerator } from 'kubb/kit'
import { File, jsxRenderer } from 'kubb/jsx'
import { Zod } from '../components/Zod.tsx'
import { collectDirectionalRefNames, containsDirectionalNode, printerZod } from '../printers/printerZod.ts'
import type { PrinterZodOptions } from '../printers/printerZod.ts'
import { printerZodMini } from '../printers/printerZodMini.ts'
import type { PluginZod, ResolverZod } from '../types'

/**
 * The helper an inferred alias is printed with. `'codec'` reads a request (encode) schema from its
 * input and a response (decode) schema from its output; `true` keeps `z.infer` for both.
 */
function aliasKind(inferred: PluginZod['resolvedOptions']['inferred'], direction: 'encode' | 'decode'): 'infer' | 'input' | 'output' {
  if (inferred !== 'codec') return 'infer'
  return direction === 'encode' ? 'input' : 'output'
}

type StdPrinters = { decode: ReturnType<typeof printerZod>; encode: ReturnType<typeof printerZod> }
type ZodPrinterEntry = StdPrinters & { coercion: unknown; guidType: unknown; regexType: unknown; oneOfType: unknown; dateType: unknown; nodes: unknown }
type ZodMiniPrinterEntry = {
  printer: ReturnType<typeof printerZodMini>
  coercion: unknown
  guidType: unknown
  regexType: unknown
  oneOfType: unknown
  nodes: unknown
}

// Per-build caches: keyed on resolver (unique per plugin instance per build, GC'd when released)
const zodPrinterCache = new WeakMap<ResolverZod, ZodPrinterEntry>()
const zodMiniPrinterCache = new WeakMap<ResolverZod, ZodMiniPrinterEntry>()

type StdPrinterParams = {
  coercion: unknown
  guidType: unknown
  regexType: unknown
  oneOfType: unknown
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
 * Cached printer per direction for a resolver, built on first use. Schemas holding nothing that
 * converts print the same either way.
 */
function getStdPrinters(resolver: ResolverZod, params: StdPrinterParams): StdPrinters {
  const cached = zodPrinterCache.get(resolver)
  if (
    cached &&
    cached.coercion === params.coercion &&
    cached.guidType === params.guidType &&
    cached.regexType === params.regexType &&
    cached.oneOfType === params.oneOfType &&
    cached.dateType === params.dateType &&
    cached.nodes === params.nodes
  ) {
    return { decode: cached.decode, encode: cached.encode }
  }
  const decode = printerZod({ ...params, resolver, direction: 'decode' } as Parameters<typeof printerZod>[0])
  const encode = printerZod({ ...params, resolver, direction: 'encode' } as Parameters<typeof printerZod>[0])
  zodPrinterCache.set(resolver, {
    decode,
    encode,
    coercion: params.coercion,
    guidType: params.guidType,
    regexType: params.regexType,
    oneOfType: params.oneOfType,
    dateType: params.dateType,
    nodes: params.nodes,
  })
  return { decode, encode }
}

function getMiniPrinter(
  resolver: ResolverZod,
  params: {
    coercion: unknown
    guidType: unknown
    regexType: unknown
    oneOfType: unknown
    cyclicSchemas: ReadonlySet<string>
    nodes: unknown
  },
) {
  const cached = zodMiniPrinterCache.get(resolver)
  if (
    cached &&
    cached.coercion === params.coercion &&
    cached.guidType === params.guidType &&
    cached.regexType === params.regexType &&
    cached.oneOfType === params.oneOfType &&
    cached.nodes === params.nodes
  )
    return cached.printer
  const p = printerZodMini({ ...params, resolver } as Parameters<typeof printerZodMini>[0])
  zodMiniPrinterCache.set(resolver, {
    printer: p,
    coercion: params.coercion,
    guidType: params.guidType,
    regexType: params.regexType,
    oneOfType: params.oneOfType,
    nodes: params.nodes,
  })
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
    const { output, coercion, guidType, regexType, oneOfType, compile, mini, inferred, typeGuards, importPath, group, printer } = ctx.options
    const dateType = getOasAdapter(adapter).options.dateType

    if (!node.name) {
      return
    }

    const isZodImport = importPath === 'zod' || importPath === 'zod/mini'
    const cyclicSchemas = new Set<string>(ctx.meta.circularNames)
    const printerOptions: PrinterZodOptions = { coercion, guidType, regexType, oneOfType, dateType, resolver, cyclicSchemas, nodes: printer?.nodes }

    // Rendered twice: the canonical schema decodes, the `${name}InputSchema` variant encodes.
    const hasDirectionalNode = !mini && containsDirectionalNode({ node, printerOptions })

    const directionalRefNames = new Set(hasDirectionalNode ? collectDirectionalRefNames({ node, printerOptions }) : [])
    const importEntries = resolver.imports({ node, root, output, group: group ?? undefined })
    const inputImportEntries = hasDirectionalNode
      ? [...directionalRefNames].map((schemaName) => ({
          name: [resolver.schema.inputName(schemaName)],
          path: resolver.file({ name: schemaName, extname: '.ts', root, output, group: group ?? undefined }).path,
        }))
      : []
    const imports = [
      ...new Map(
        [...importEntries, ...inputImportEntries].map((imp) => [`${Array.isArray(imp.name) ? imp.name.join(',') : imp.name}|${imp.path}`, imp] as const),
      ).values(),
    ]

    const meta = {
      name: resolver.name(node.name),
      file: resolver.file({ name: node.name, extname: '.ts', root, output, group: group ?? undefined }),
    } as const

    const isName = typeGuards ? resolver.schema.isName(node.name) : null
    const assertName = typeGuards ? resolver.schema.assertName(node.name) : null

    const stdPrinters = mini ? null : getStdPrinters(resolver, { coercion, guidType, regexType, oneOfType, dateType, cyclicSchemas, nodes: printer?.nodes })
    const schemaPrinter = mini
      ? getMiniPrinter(resolver, { coercion, guidType, regexType, oneOfType, cyclicSchemas, nodes: printer?.nodes })
      : stdPrinters!.decode

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

        <Zod
          name={meta.name}
          node={node}
          printer={schemaPrinter}
          inferTypeName={inferred ? resolver.schema.typeName(node.name) : null}
          inferKind={aliasKind(inferred, 'decode')}
          typeGuards={typeGuards}
          isName={isName}
          assertName={assertName}
          mini={mini}
          cyclic={cyclicSchemas.has(node.name)}
          compile={compile}
        />
        {hasDirectionalNode && stdPrinters && (
          <Zod
            name={resolver.schema.inputName(node.name)}
            node={node}
            printer={stdPrinters.encode}
            inferTypeName={inferred ? resolver.schema.inputTypeName(node.name) : null}
            inferKind={aliasKind(inferred, 'encode')}
            typeGuards={typeGuards}
            isName={typeGuards ? resolver.schema.isName(resolver.schema.inputName(node.name)) : null}
            assertName={typeGuards ? resolver.schema.assertName(resolver.schema.inputName(node.name)) : null}
            mini={mini}
            cyclic={cyclicSchemas.has(node.name)}
            compile={compile}
          />
        )}
      </File>
    )
  },
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { adapter, config, resolver, root } = ctx
    const { output, coercion, guidType, regexType, oneOfType, compile, mini, inferred, importPath, group, printer } = ctx.options
    const dateType = getOasAdapter(adapter).options.dateType

    const isZodImport = importPath === 'zod' || importPath === 'zod/mini'

    const meta = {
      file: resolver.file({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path, root, output, group: group ?? undefined }),
    } as const

    const cyclicSchemas = new Set<string>(ctx.meta.circularNames)
    const printerOptions: PrinterZodOptions = { coercion, guidType, regexType, oneOfType, dateType, resolver, cyclicSchemas, nodes: printer?.nodes }

    function renderSchemaEntry({
      schema,
      name,
      keysToOmit,
      direction = 'decode',
    }: {
      schema: ast.SchemaNode | null
      name: string
      keysToOmit?: Array<string> | null
      direction?: 'encode' | 'decode'
    }) {
      if (!schema) return null

      const directionalRefNames = direction === 'encode' && !mini ? new Set(collectDirectionalRefNames({ node: schema, printerOptions })) : null
      const imports = resolver.imports({
        node: schema,
        root,
        output,
        group: group ?? undefined,
        name: (schemaName) => (directionalRefNames?.has(schemaName) ? resolver.schema.inputName(schemaName) : resolver.name(schemaName)),
      })

      const schemaPrinter = mini
        ? keysToOmit?.length
          ? printerZodMini({ coercion, guidType, regexType, oneOfType, resolver, keysToOmit, cyclicSchemas, nodes: printer?.nodes })
          : getMiniPrinter(resolver, { coercion, guidType, regexType, oneOfType, cyclicSchemas, nodes: printer?.nodes })
        : keysToOmit?.length
          ? printerZod({
              coercion,
              guidType,
              regexType,
              oneOfType,
              dateType,
              resolver,
              keysToOmit,
              cyclicSchemas,
              nodes: printer?.nodes,
              direction,
            })
          : getStdPrinters(resolver, { coercion, guidType, regexType, oneOfType, dateType, cyclicSchemas, nodes: printer?.nodes })[direction]

      return (
        <>
          {imports.map((imp) => (
            <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
          ))}
          {/* Operation schemas reference (and import) the component schemas, which carry the
              `z.ZodType` annotation at their own definition when cyclic. Annotating the operation
              schema too would only erase its inferred type to `unknown`, breaking typed consumers
              (e.g. the MCP server's request types), so it is never marked cyclic here. */}
          <Zod
            name={name}
            node={schema}
            printer={schemaPrinter}
            inferTypeName={inferred ? resolver.schema.type(name) : null}
            inferKind={aliasKind(inferred, direction)}
            cyclic={false}
            compile={compile}
          />
        </>
      )
    }

    // Multiple content types for a single name: emit one schema per content type plus a union alias.
    function buildContentTypeVariants(
      entries: Array<{ contentType: string; schema?: ast.SchemaNode | null; keysToOmit?: Array<string> | null }>,
      baseName: string,
      decorate?: (schema: ast.SchemaNode) => ast.SchemaNode,
      direction?: 'encode' | 'decode',
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
          (res.content ?? []).flatMap((entry) => (entry.schema ? ast.collectImportedRefNames(entry.schema).map((refName) => resolver.name(refName)) : [])),
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

    const paramSchemas = node.parameters.map((param) =>
      renderSchemaEntry({ schema: param.schema, name: resolver.param.name(node, param), direction: 'encode' }),
    )

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
          direction: 'encode',
        })
      }
      return buildContentTypeVariants(
        requestBodyContent,
        resolver.response.body(node),
        (schema) => ({
          ...schema,
          description: node.requestBody!.description ?? schema.description,
        }),
        'encode',
      )
    })()

    // Grouped path/query/headers schemas, one object per group: what a client's `validator.path` /
    // `query` / `headers` runs at request time, and what the options schema below references.
    const { path, query, header } = getOperationParameters(node)

    const paramGroupSchemas = (
      [
        { kind: 'path', params: path },
        { kind: 'query', params: query },
        { kind: 'headers', params: header },
      ] as const
    )
      .filter(({ params }) => params.length > 0)
      .map(({ kind, params }) =>
        renderSchemaEntry({
          schema: ast.factory.createSchema({
            type: 'object',
            // `primitive: 'object'` makes the printer emit `z.object(…)` rather than a record.
            primitive: 'object',
            properties: params.map((param) => ast.factory.createProperty({ name: param.name, required: param.required, schema: param.schema })),
          }),
          name: resolver.param[kind](node, params[0]!),
          direction: 'encode',
        }),
      )

    // The combined `{ body, path, query, headers }` options and per-status `responses` schemas exist
    // only to back `resolver.response.options(node)` and `resolver.response.responses(node)` for
    // consumers sourcing types from this plugin instead of `plugin-ts`. Not worth generating when
    // nothing will import them.
    const optionsSchema = inferred
      ? renderSchemaEntry({ schema: buildOptionsSchema(node, resolver), name: resolver.name(`${node.operationId} Options`), direction: 'encode' })
      : null

    // The per-status record a client's `RequestResult` is keyed on. Response bodies, so `output`.
    const responsesSchema = inferred ? renderSchemaEntry({ schema: buildResponses(node, resolver), name: resolver.response.responses(node) }) : null

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
        {responsesSchema}
      </File>
    )
  },
})
