import {
  buildOptionsSchema,
  buildResponses,
  getCircularNames,
  getOasAdapter,
  getOperationParameters,
  resolveContentTypeVariants,
  resolveOperationFile,
  toResponseContent,
} from '@internals/shared'
import { ast, defineGenerator } from '@kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Zod } from '../components/Zod.tsx'
import { collectDirectionalRefNames, containsDirectionalNode, printerZod } from '../printers/printerZod.ts'
import type { PrinterZodOptions } from '../printers/printerZod.ts'
import { printerZodMini } from '../printers/printerZodMini.ts'
import type { PrinterZodMiniOptions } from '../printers/printerZodMini.ts'
import type { PluginZod, ResolverZod } from '../types'
import { containsIdentifier, shouldCoerce } from '../utils.ts'

/**
 * The helper an inferred alias is printed with. `'codec'` reads a request (encode) schema from its
 * input and a response (decode) schema from its output; `true` keeps `z.infer` for both.
 */
function aliasKind(inferred: PluginZod['resolvedOptions']['inferred'], direction: 'encode' | 'decode'): 'infer' | 'input' | 'output' {
  if (inferred !== 'codec') return 'infer'
  return direction === 'encode' ? 'input' : 'output'
}

type BuildResponseUnionParams = {
  responses: Array<ast.ResponseNode>
  name: string
  fallbackUnknown: boolean
}

/**
 * The printer for one direction, built once per plugin per build. A `keysToOmit` list and a
 * `printer.nodes` override differ per node and have no string key, so they get a fresh printer.
 */
function getPrinter(resolver: ResolverZod, options: PrinterZodOptions, mini: boolean, direction: 'encode' | 'decode') {
  const build = () => (mini ? printerZodMini(options as PrinterZodMiniOptions) : printerZod({ ...options, direction }))
  if (options.nodes || options.keysToOmit?.length) return build()
  const { coercion, guidType, regexType, oneOfType, dateType } = options
  const coerce = (['dates', 'strings', 'numbers'] as const).map((type) => shouldCoerce(coercion, type))
  return resolver.memo(`zodPrinter:${[mini, direction, ...coerce, guidType, regexType, oneOfType, dateType].join(':')}`, build)
}

// `checks` also returns the refs inside `conditionals` and `contains`. A check the printer leaves out, such as
// `minContains: 0`, names no schema, so its import is dropped.
function resolveImports(resolver: ResolverZod, params: Parameters<ResolverZod['imports']>[0], print: () => string | null | undefined) {
  const imports = resolver.imports(params)
  const withChecks = resolver.imports({ ...params, checks: true })
  if (withChecks.length === imports.length) return imports
  const text = print() ?? ''

  return withChecks.filter((entry) => [entry.name].flat().some((name) => containsIdentifier(text, String(name))))
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
    const cyclicSchemas = getCircularNames(ctx)
    const printerOptions: PrinterZodOptions = { coercion, guidType, regexType, oneOfType, dateType, resolver, cyclicSchemas, nodes: printer?.nodes }

    // Rendered twice: the canonical schema decodes, the `${name}InputSchema` variant encodes.
    const hasDirectionalNode = !mini && containsDirectionalNode({ node, printerOptions })

    const directionalRefNames = new Set(hasDirectionalNode ? collectDirectionalRefNames({ node, printerOptions }) : [])
    const importEntries = resolveImports(resolver, { node, root, output, group: group ?? undefined }, () =>
      getPrinter(resolver, printerOptions, mini, 'decode').print(node),
    )
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

    const schemaPrinter = getPrinter(resolver, printerOptions, mini, 'decode')

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
        {hasDirectionalNode && (
          <Zod
            name={resolver.schema.inputName(node.name)}
            node={node}
            printer={getPrinter(resolver, printerOptions, mini, 'encode')}
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
    if (!ast.http.is(node)) return null
    const { adapter, config, resolver, root } = ctx
    const { output, coercion, guidType, regexType, oneOfType, compile, mini, inferred, importPath, group, printer } = ctx.options
    const dateType = getOasAdapter(adapter).options.dateType

    const isZodImport = importPath === 'zod' || importPath === 'zod/mini'

    const meta = {
      file: resolveOperationFile({ ctx, node, resolver, root, output, group }),
    } as const

    const cyclicSchemas = getCircularNames(ctx)
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
      const schemaPrinter = getPrinter(resolver, { ...printerOptions, keysToOmit }, mini, direction)
      const imports = resolveImports(
        resolver,
        {
          node: schema,
          root,
          output,
          group: group ?? undefined,
          name: (schemaName) => (directionalRefNames?.has(schemaName) ? resolver.schema.inputName(schemaName) : resolver.name(schemaName)),
        },
        () => schemaPrinter.print(schema),
      )

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
      const content = (res.content ?? []).map((entry, _, content) => toResponseContent(entry, content))
      const variants = content.filter((entry) => entry.schema)
      if (variants.length > 1) {
        return buildContentTypeVariants(content, resolver.response.status(node, res.statusCode))
      }
      const primary = variants[0] ?? content[0]
      return renderSchemaEntry({
        schema: primary?.schema ?? null,
        name: resolver.response.status(node, res.statusCode),
        keysToOmit: primary?.keysToOmit,
      })
    })

    const toParamsSchema = (params: Array<ast.ParameterNode>) =>
      ast.factory.createSchema({
        type: 'object',
        // `primitive: 'object'` makes the printer emit `z.object(…)` rather than a record.
        primitive: 'object',
        properties: params.map((param) => ast.factory.createProperty({ name: param.name, required: param.required, schema: param.schema })),
      })

    const responseHeaderSchemas = node.responses.map((res) =>
      res.headers?.length ? renderSchemaEntry({ schema: toParamsSchema(res.headers), name: resolver.response.headers(node, res.statusCode) }) : null,
    )

    const responsesWithSchema = node.responses.filter((res) => res.content?.some((entry) => entry.schema))
    // Validate success (2xx) bodies only. Error bodies are surfaced unparsed, typed by plugin-ts (#369).
    const successResponsesWithSchema = responsesWithSchema.filter((res) => ast.http.status.isSuccess(res.statusCode))
    const responseUnionSchema =
      responsesWithSchema.length > 0
        ? buildResponseUnion({ responses: successResponsesWithSchema, name: resolver.response.response(node), fallbackUnknown: true })
        : null

    // Validate error bodies on the non-throw path. Mirrors the success union but selects every
    // non-2xx response (including the OpenAPI `default`) so it lines up with plugin-ts `ErrorOf` (#369).
    const errorResponsesWithSchema = responsesWithSchema.filter((res) => !ast.http.status.isSuccess(res.statusCode))
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

    // Grouped path/query/headers/cookies schemas, one object per group: what a client's `validator.path` /
    // `query` / `headers` runs at request time, and what the options schema below references.
    const { path, query, header, cookie } = getOperationParameters(node)

    const paramGroupSchemas = (
      [
        { kind: 'path', params: path },
        { kind: 'query', params: query },
        { kind: 'headers', params: header },
        { kind: 'cookies', params: cookie },
      ] as const
    )
      .filter(({ params }) => params.length > 0)
      .map(({ kind, params }) =>
        renderSchemaEntry({
          schema: toParamsSchema(params),
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
        {responseHeaderSchemas}
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
