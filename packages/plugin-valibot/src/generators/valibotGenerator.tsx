import {
  buildOptionsSchema,
  buildResponses,
  getCircularNames,
  getOasAdapter,
  resolveContentTypeVariants,
  resolveOperationFile,
  toResponseContent,
} from '@internals/shared'
import { ast, defineGenerator } from '@kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Valibot } from '../components/Valibot.tsx'
import { collectDirectionalRefNames, containsDirectionalNode, printerValibot } from '../printers/printerValibot.ts'
import type { PrinterValibotOptions } from '../printers/printerValibot.ts'
import type { PluginValibot, ResolverValibot } from '../types.ts'

type BuildResponseUnionParams = {
  responses: Array<ast.ResponseNode>
  name: string
  fallbackUnknown: boolean
}

// The comment above a schema const. A `$ref` const takes none, because the const it points to has it.
function jsDoc(node: ast.SchemaNode): { description?: string; deprecated?: boolean } {
  return node.type === ast.schema.types.ref ? {} : { description: node.description, deprecated: node.deprecated }
}

type Direction = NonNullable<PrinterValibotOptions['direction']>

/**
 * The printer for one direction, built once per plugin per build. A `keysToOmit` list and a
 * `printer.nodes` override differ per node and have no string key, so they get a fresh printer.
 */
function getPrinter(resolver: ResolverValibot, options: PrinterValibotOptions, direction: Direction) {
  const build = () => printerValibot({ ...options, direction })
  if (options.nodes || options.keysToOmit?.length) return build()

  return resolver.memo(
    `valibotPrinter:${[direction, JSON.stringify(options.coercion), options.regexType, options.oneOfType, options.dateType].join(':')}`,
    build,
  )
}

// A request schema is typed by the value the caller passes, every other schema by the value it returns.
const inferKinds = { encode: 'InferInput', decode: 'InferOutput' } as const

/**
 * Built-in generator for `@kubb/plugin-valibot`. Emits one Valibot schema per schema in the spec,
 * plus the parameter, request, and response schemas of each operation.
 */
export const valibotGenerator = defineGenerator<PluginValibot>({
  name: 'valibot',
  renderer: jsxRenderer,
  schema(node, ctx) {
    const { adapter, config, resolver, root } = ctx
    const { output, regexType, oneOfType, coercion, inferred, typeGuards, importPath, group, printer } = ctx.options

    if (!node.name) {
      return
    }

    const cyclicSchemas = getCircularNames(ctx)
    const dateType = getOasAdapter(adapter).options.dateType
    const printerOptions: PrinterValibotOptions = { regexType, oneOfType, coercion, dateType, resolver, cyclicSchemas, nodes: printer?.nodes }
    // Rendered twice: the schema decodes, and its `${name}InputSchema` variant encodes.
    const hasDirectionalNode = containsDirectionalNode({ node, printerOptions })
    const inputImports = hasDirectionalNode
      ? collectDirectionalRefNames({ node, printerOptions }).map((schemaName) => ({
          name: [resolver.schema.inputName(schemaName)],
          path: resolver.file({ name: schemaName, extname: '.ts', root, output, group: group ?? undefined }).path,
        }))
      : []
    const imports = [
      ...new Map(
        [...resolver.imports({ node, root, output, group: group ?? undefined, checks: true }), ...inputImports].map(
          (imp) => [`${Array.isArray(imp.name) ? imp.name.join(',') : imp.name}|${imp.path}`, imp] as const,
        ),
      ).values(),
    ]
    const inputName = resolver.schema.inputName(node.name)
    const meta = {
      name: resolver.name(node.name),
      file: resolver.file({ name: node.name, extname: '.ts', root, output, group: group ?? undefined }),
    } as const

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name="v" path={importPath} isNameSpace />
        {imports.map((imp) => (
          <File.Import key={[node.name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
        ))}

        <Valibot
          name={meta.name}
          node={node}
          printer={getPrinter(resolver, printerOptions, 'decode')}
          inferTypeName={inferred ? resolver.schema.typeName(node.name) : null}
          typeGuards={typeGuards}
          isName={resolver.schema.isName(node.name)}
          assertName={resolver.schema.assertName(node.name)}
          cyclic={cyclicSchemas.has(node.name)}
          {...jsDoc(node)}
        />
        {hasDirectionalNode && (
          <Valibot
            name={inputName}
            node={node}
            printer={getPrinter(resolver, printerOptions, 'encode')}
            inferTypeName={inferred ? resolver.schema.inputTypeName(node.name) : null}
            inferKind="InferInput"
            typeGuards={typeGuards}
            isName={resolver.schema.isName(inputName)}
            assertName={resolver.schema.assertName(inputName)}
            cyclic={cyclicSchemas.has(node.name)}
            {...jsDoc(node)}
          />
        )}
      </File>
    )
  },
  operation(node, ctx) {
    if (!ast.http.isOperation(node)) return null
    const { adapter, config, resolver, root } = ctx
    const { output, regexType, oneOfType, coercion, inferred, importPath, group, printer } = ctx.options
    const dateType = getOasAdapter(adapter).options.dateType

    const meta = {
      file: resolveOperationFile({ ctx, node, resolver, root, output, group }),
    } as const

    const cyclicSchemas = getCircularNames(ctx)
    const printerOptions: PrinterValibotOptions = { regexType, oneOfType, coercion, dateType, resolver, cyclicSchemas, nodes: printer?.nodes }

    function renderSchemaEntry({
      schema,
      name,
      keysToOmit,
      direction = 'decode',
    }: {
      schema: ast.SchemaNode | null
      name: string
      keysToOmit?: Array<string> | null
      direction?: Direction
    }) {
      if (!schema) return null
      // A circular const is typed `v.GenericSchema`, which `v.omit` does not take, so its object prints here without the keys.
      const refName = schema.type === 'ref' ? ast.ref.getName(schema) : null
      const target = schema.type === 'ref' ? schema.schema : undefined
      if (keysToOmit?.length && target && refName && cyclicSchemas.has(refName)) {
        const declaresKey = (node: ast.SchemaNode) => keysToOmit.some((propertyName) => ast.schema.findProperties({ node, propertyName }).length > 0)
        // Drops the keys from an object, from every `allOf` member, and from a `$ref` member that declares one, which prints inline.
        const withoutKeys = (node: ast.SchemaNode, seen = new Set<ast.SchemaNode>()): ast.SchemaNode => {
          if (node.type === 'object') return { ...node, properties: node.properties.filter((property) => !keysToOmit.includes(property.name)) }
          if (node.type === 'intersection') return { ...node, members: (node.members ?? []).map((member) => withoutKeys(member, seen)) }
          if (node.type !== 'ref' || !node.schema || seen.has(node.schema) || !declaresKey(node.schema)) return node

          // A copy per branch: the set stops a cycle, and a schema that two members reference prints inline in both.
          return withoutKeys(node.schema, new Set(seen).add(node.schema))
        }
        const inline = withoutKeys(target)
        if (inline.type === 'object' || inline.type === 'intersection') return renderSchemaEntry({ schema: inline, name, direction })
      }

      const inputRefNames = direction === 'encode' ? new Set(collectDirectionalRefNames({ node: schema, printerOptions })) : null
      const imports = resolver.imports({
        node: schema,
        root,
        output,
        group: group ?? undefined,
        checks: true,
        name: (schemaName) => (inputRefNames?.has(schemaName) ? resolver.schema.inputName(schemaName) : resolver.name(schemaName)),
      })

      return (
        <>
          {imports.map((imp) => (
            <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
          ))}
          {/* A circular component schema carries the `v.GenericSchema` annotation at its own definition.
              Annotating the operation schema too would erase its inferred type to `unknown`. */}
          <Valibot
            name={name}
            node={schema}
            printer={getPrinter(resolver, { ...printerOptions, keysToOmit }, direction)}
            inferTypeName={inferred ? resolver.schema.type(name) : null}
            inferKind={inferKinds[direction]}
            {...jsDoc(schema)}
          />
        </>
      )
    }

    // Multiple content types for a single name: emit one schema per content type plus a union alias.
    function buildContentTypeVariants(
      entries: Array<{ contentType: string; schema?: ast.SchemaNode | null; keysToOmit?: Array<string> | null }>,
      baseName: string,
      direction?: Direction,
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
              schema: variant.schema,
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
      const importedNames = new Set(ast.http.responses.getImportedNames(responses).map((refName) => resolver.name(refName)))

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
        // `primitive: 'object'` makes the printer emit `v.object(…)` rather than a record.
        primitive: 'object',
        properties: params.map((param) => ast.factory.createProperty({ name: param.name, required: param.required, schema: param.schema })),
      })

    // Each parameter already has its own const, optional wrapper included, so the group points at it.
    const toParamRefsSchema = (params: Array<ast.ParameterNode>) =>
      ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: params.map((param) =>
          ast.factory.createProperty({
            name: param.name,
            required: true,
            schema: ast.factory.createSchema({ type: 'ref', name: resolver.param.name(node, param) }),
          }),
        ),
      })

    const responseHeaderSchemas = node.responses.map((res) =>
      res.headers?.length ? renderSchemaEntry({ schema: toParamsSchema(res.headers), name: resolver.response.headers(node, res.statusCode) }) : null,
    )

    const responsesWithSchema = node.responses.filter((res) => res.content?.some((entry) => entry.schema))
    // The response schema covers success (2xx) bodies only.
    const successResponsesWithSchema = responsesWithSchema.filter((res) => ast.http.status.isSuccess(res))
    const responseUnionSchema =
      responsesWithSchema.length > 0
        ? buildResponseUnion({ responses: successResponsesWithSchema, name: resolver.response.response(node), fallbackUnknown: true })
        : null

    // The error schema covers every non-2xx response, including the OpenAPI `default`.
    const errorResponsesWithSchema = responsesWithSchema.filter((res) => !ast.http.status.isSuccess(res))
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
          schema: entry.schema,
          name: resolver.response.body(node),
          keysToOmit: entry.keysToOmit,
          direction: 'encode',
        })
      }
      return buildContentTypeVariants(requestBodyContent, resolver.response.body(node), 'encode')
    })()

    // Grouped path, query, headers, and cookies schemas, one object per group.
    const { path, query, header, cookie } = ast.http.groupParameters(node)

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
          schema: toParamRefsSchema(params),
          name: resolver.param[kind](node, params[0]!),
          direction: 'encode',
        }),
      )

    // The combined options object and the per-status record back `resolver.response.options(node)` and
    // `resolver.response.responses(node)`, for callers that take their types from this plugin.
    const optionsSchema = inferred
      ? renderSchemaEntry({ schema: buildOptionsSchema(node, resolver), name: resolver.name(`${node.operationId} Options`), direction: 'encode' })
      : null
    const responsesSchema = inferred ? renderSchemaEntry({ schema: buildResponses(node, resolver), name: resolver.response.responses(node) }) : null

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name="v" path={importPath} isNameSpace />
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
