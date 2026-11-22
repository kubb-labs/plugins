import { ast } from '@internals/ast'
import {
  buildContentTypeEntries,
  buildOptionsSchema,
  buildParamRefsSchema,
  buildParamsSchema,
  buildResponseUnionSchema,
  buildResponses,
  getCircularNames,
  getOasAdapter,
  schemaComments,
  toResponseContent,
} from '@internals/shared'
import { defineGenerator, type PrinterFactory } from '@kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Valibot } from '../components/Valibot.tsx'
import { collectDirectionalRefNames, containsDirectionalNode, printerValibot } from '../printers/printerValibot.ts'
import type { PrinterValibotOptions } from '../printers/printerValibot.ts'
import type { PluginValibot } from '../types.ts'

type Direction = NonNullable<PrinterValibotOptions['direction']>

/**
 * The `setPrinter` factory of `@kubb/plugin-valibot`. Generators pass `direction` and `keysToOmit`
 * per node through `printer.with(...)`.
 */
export const createPrinterValibot: PrinterFactory<PluginValibot> = (ctx) => {
  const { regexType, oneOfType, coercion, printer } = ctx.options
  return printerValibot({
    regexType,
    oneOfType,
    coercion,
    dateType: getOasAdapter(ctx.adapter).options.dateType,
    resolver: ctx.resolver,
    // A `printer.nodes` override can print differently per call, so its lookups are not cached.
    directionalCache: printer?.nodes ? undefined : new WeakMap(),
    cyclicSchemas: getCircularNames(),
    nodes: printer?.nodes,
  })
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
    const { output, inferred, typeGuards, importPath, group } = ctx.options

    if (!node.name) {
      return
    }

    const cyclicSchemas = getCircularNames()
    const printerOptions = ctx.printer.options
    // Rendered twice: the schema decodes, and its `${name}InputSchema` variant encodes.
    const hasDirectionalNode = containsDirectionalNode({ node, printerOptions })
    const valibot = ctx.from().resolver
    const inputImports = hasDirectionalNode
      ? collectDirectionalRefNames({ node, printerOptions }).flatMap((schemaName) => valibot.schema.inputName(schemaName).import ?? [])
      : []
    const imports = [...ctx.resolver.imports({ node, root: ctx.root, output, group: group ?? undefined, checks: true }), ...inputImports]
    const inputName = ctx.resolver.schema.inputName(node.name)
    const meta = {
      name: ctx.resolver.name(node.name),
      file: ctx.file(node),
    } as const

    return (
      <File {...meta.file}>
        <File.Import names={[{ name: '*', alias: 'v', space: 'value' }]} path={importPath} />
        {imports.map((imp) => (
          <File.Import key={[node.name, imp.path].join('-')} names={ast.file.getNames(imp)} root={meta.file.path} path={imp.path} />
        ))}

        <Valibot
          name={meta.name}
          node={node}
          printer={ctx.printer.with({ direction: 'decode' })}
          inferTypeName={inferred ? ctx.resolver.schema.typeName(node.name) : null}
          typeGuards={typeGuards}
          isName={ctx.resolver.schema.isName(node.name)}
          assertName={ctx.resolver.schema.assertName(node.name)}
          cyclic={cyclicSchemas.has(node.name)}
          comments={schemaComments(node)}
        />
        {hasDirectionalNode && (
          <Valibot
            name={inputName}
            node={node}
            printer={ctx.printer.with({ direction: 'encode' })}
            inferTypeName={inferred ? ctx.resolver.schema.inputTypeName(node.name) : null}
            inferKind="InferInput"
            typeGuards={typeGuards}
            isName={ctx.resolver.schema.isName(inputName)}
            assertName={ctx.resolver.schema.assertName(inputName)}
            cyclic={cyclicSchemas.has(node.name)}
            comments={schemaComments(node)}
          />
        )}
      </File>
    )
  },
  operation(node, ctx) {
    if (!ast.http.isOperation(node)) return null
    const { output, inferred, importPath, group } = ctx.options

    const meta = {
      file: ctx.file(node),
    } as const

    const cyclicSchemas = getCircularNames()
    const printerOptions = ctx.printer.options

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
      const imports = ctx.resolver.imports({
        node: schema,
        root: ctx.root,
        output,
        group: group ?? undefined,
        checks: true,
        name: (schemaName) => (inputRefNames?.has(schemaName) ? ctx.resolver.schema.inputName(schemaName) : ctx.resolver.name(schemaName)),
      })

      return (
        <>
          {imports.map((imp) => (
            <File.Import key={[name, imp.path].join('-')} names={ast.file.getNames(imp)} root={meta.file.path} path={imp.path} />
          ))}
          {/* A circular component schema carries the `v.GenericSchema` annotation at its own definition.
              Annotating the operation schema too would erase its inferred type to `unknown`. */}
          <Valibot
            name={name}
            node={schema}
            printer={ctx.printer.with({ keysToOmit, direction })}
            inferTypeName={inferred ? ctx.resolver.schema.type(name) : null}
            inferKind={inferKinds[direction]}
            comments={schemaComments(schema)}
          />
        </>
      )
    }

    // Several content types for one name: one schema per content type, then the union of them.
    const renderContentTypeVariants = (entries: Parameters<typeof buildContentTypeEntries>[0], baseName: string, direction?: Direction) => (
      <>{buildContentTypeEntries(entries, baseName).map((entry) => renderSchemaEntry({ ...entry, direction }))}</>
    )
    const renderResponseUnion = (responses: Array<ast.ResponseNode>, name: string, fallbackUnknown: boolean) =>
      renderSchemaEntry({ schema: buildResponseUnionSchema({ node, responses, name, resolver: ctx.resolver, fallbackUnknown }), name })

    const paramSchemas = node.parameters.map((param) =>
      renderSchemaEntry({ schema: param.schema, name: ctx.resolver.param.name(node, param), direction: 'encode' }),
    )

    const responseSchemas = node.responses.map((res) => {
      const content = (res.content ?? []).map((entry, _, content) => toResponseContent(entry, content))
      const variants = content.filter((entry) => entry.schema)
      if (variants.length > 1) {
        return renderContentTypeVariants(content, ctx.resolver.response.status(node, res.statusCode))
      }
      const primary = variants[0] ?? content[0]
      return renderSchemaEntry({
        schema: primary?.schema ?? null,
        name: ctx.resolver.response.status(node, res.statusCode),
        keysToOmit: primary?.keysToOmit,
      })
    })

    const responseHeaderSchemas = node.responses.map((res) =>
      res.headers?.length ? renderSchemaEntry({ schema: buildParamsSchema(res.headers), name: ctx.resolver.response.headers(node, res.statusCode) }) : null,
    )

    const responsesWithSchema = node.responses.filter((res) => res.content?.some((entry) => entry.schema))
    // The response schema covers success (2xx) bodies only.
    const successResponsesWithSchema = responsesWithSchema.filter((res) => ast.http.status.isSuccess(res))
    const responseUnionSchema =
      responsesWithSchema.length > 0 ? renderResponseUnion(successResponsesWithSchema, ctx.resolver.response.response(node), true) : null

    // The error schema covers every non-2xx response, including the OpenAPI `default`.
    const errorResponsesWithSchema = responsesWithSchema.filter((res) => !ast.http.status.isSuccess(res))
    const errorUnionSchema =
      errorResponsesWithSchema.length > 0 ? renderResponseUnion(errorResponsesWithSchema, ctx.resolver.response.error(node), false) : null

    const requestBodyContent = node.requestBody?.content ?? []
    const requestSchema = (() => {
      if (requestBodyContent.length === 0) return null
      if (requestBodyContent.length === 1) {
        const entry = requestBodyContent[0]!
        if (!entry.schema) return null
        return renderSchemaEntry({
          schema: entry.schema,
          name: ctx.resolver.response.body(node),
          keysToOmit: entry.keysToOmit,
          direction: 'encode',
        })
      }
      return renderContentTypeVariants(requestBodyContent, ctx.resolver.response.body(node), 'encode')
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
          schema: buildParamRefsSchema({ node, params, resolver: ctx.resolver }),
          name: ctx.resolver.param[kind](node, params[0]!),
          direction: 'encode',
        }),
      )

    // The combined options object and the per-status record back `resolver.response.options(node)` and
    // `resolver.response.responses(node)`, for callers that take their types from this plugin.
    const optionsSchema = inferred
      ? renderSchemaEntry({ schema: buildOptionsSchema(node, ctx.resolver), name: ctx.resolver.name(`${node.operationId} Options`), direction: 'encode' })
      : null
    const responsesSchema = inferred ? renderSchemaEntry({ schema: buildResponses(node, ctx.resolver), name: ctx.resolver.response.responses(node) }) : null

    return (
      <File {...meta.file}>
        <File.Import names={[{ name: '*', alias: 'v', space: 'value' }]} path={importPath} />
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
