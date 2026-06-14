import { resolveContentTypeVariants } from '@internals/shared'
import { ast, defineGenerator } from '@kubb/core'
import { caseParams } from '@kubb/ast/utils'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Type } from '../components/Type.tsx'
import { ENUM_TYPES_WITH_KEY_SUFFIX } from '../constants.ts'
import { printerTs } from '../printers/printerTs.ts'
import type { PluginTs } from '../types'
import { buildData, buildResponses, buildResponseUnion } from '../utils.ts'

/**
 * Built-in generator for `@kubb/plugin-ts`. Emits one TypeScript file per
 * schema in the spec plus per-operation request, response, and parameter
 * types. Drop-replace with a custom `Generator<PluginTs>` to change how
 * TypeScript output is produced.
 */
export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  renderer: jsxRenderer,
  schema(node, ctx) {
    const { enum: enumOptions, syntaxType, optionalType, arrayType, output, group, printer } = ctx.options
    const { adapter, config, resolver, root } = ctx

    if (!node.name) {
      return
    }
    // Build a set of schema names that are enums so the ref handler and getImports
    // callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = new Set<string>(ctx.meta.enumNames)

    function resolveImportName(schemaName: string): string {
      if (ENUM_TYPES_WITH_KEY_SUFFIX.has(enumOptions.type) && enumOptions.typeSuffix && enumSchemaNames.has(schemaName)) {
        return resolver.resolveEnumKeyName({ name: schemaName }, enumOptions.typeSuffix)
      }
      return resolver.resolveTypeName(schemaName)
    }

    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolveImportName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group: group ?? undefined }).path,
    }))

    const isEnumSchema = !!ast.narrowSchema(node, ast.schemaTypes.enum)

    const meta = {
      name:
        ENUM_TYPES_WITH_KEY_SUFFIX.has(enumOptions.type) && isEnumSchema
          ? resolver.resolveEnumKeyName(node, enumOptions.typeSuffix)
          : resolver.resolveTypeName(node.name),
      file: resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group: group ?? undefined }),
    } as const

    const schemaPrinter = printerTs({
      optionalType,
      arrayType,
      enum: enumOptions,
      name: meta.name,
      syntaxType,
      description: node.description,
      resolver,
      enumSchemaNames,
      nodes: printer?.nodes,
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        {imports.map((imp) => (
          <File.Import key={[node.name, imp.path, imp.isTypeOnly].join('-')} root={meta.file.path} path={imp.path} name={imp.name} isTypeOnly />
        ))}
        <Type name={meta.name} node={node} enum={enumOptions} resolver={resolver} printer={schemaPrinter} />
      </File>
    )
  },
  operation(node, ctx) {
    const { enum: enumOptions, optionalType, arrayType, syntaxType, paramsCasing, group, output, printer } = ctx.options
    const { adapter, config, resolver, root } = ctx

    const params = caseParams(node.parameters, paramsCasing)

    const meta = {
      file: resolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: group ?? undefined },
      ),
    } as const

    // Build a set of schema names that are enums so the ref handler and getImports
    // callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = new Set<string>(ctx.meta.enumNames)

    function resolveImportName(schemaName: string): string {
      if (ENUM_TYPES_WITH_KEY_SUFFIX.has(enumOptions.type) && enumOptions.typeSuffix && enumSchemaNames.has(schemaName)) {
        return resolver.resolveEnumKeyName({ name: schemaName }, enumOptions.typeSuffix)
      }
      return resolver.resolveTypeName(schemaName)
    }

    function renderSchemaType({ schema, name, keysToOmit }: { schema: ast.SchemaNode | null; name: string; keysToOmit?: Array<string> | null }) {
      if (!schema) return null

      const imports = adapter.getImports(schema, (schemaName) => ({
        name: resolveImportName(schemaName),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group: group ?? undefined }).path,
      }))

      const schemaPrinter = printerTs({
        optionalType,
        arrayType,
        enum: enumOptions,
        name,
        syntaxType,
        description: schema.description,
        keysToOmit,
        resolver,
        enumSchemaNames,
        nodes: printer?.nodes,
      })

      return (
        <>
          {imports.map((imp) => (
            <File.Import key={[name, imp.path, imp.isTypeOnly].join('-')} root={meta.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}
          <Type name={name} node={schema} enum={enumOptions} resolver={resolver} printer={schemaPrinter} />
        </>
      )
    }

    /**
     * Emits an individual type per content type plus a union alias under `baseName`.
     * Shared by the request body and multi-content-type responses.
     */
    function buildContentTypeVariants(
      entries: Array<{ contentType: string; schema?: ast.SchemaNode | null; keysToOmit?: Array<string> | null }>,
      baseName: string,
      decorate?: (schema: ast.SchemaNode) => ast.SchemaNode,
    ) {
      const variants = resolveContentTypeVariants(entries, baseName)
      const unionSchema = ast.factory.createSchema({
        type: 'union',
        members: variants.map((variant) => ast.factory.createSchema({ type: 'ref', name: variant.name })),
      })
      return (
        <>
          {variants.map((variant) =>
            renderSchemaType({
              schema: decorate ? decorate(variant.schema) : variant.schema,
              name: variant.name,
              keysToOmit: variant.keysToOmit,
            }),
          )}
          {renderSchemaType({ schema: unionSchema, name: baseName })}
        </>
      )
    }

    const paramTypes = params.map((param) =>
      renderSchemaType({
        schema: param.schema,
        name: resolver.resolveParamName(node, param),
      }),
    )

    const requestBodyContent = node.requestBody?.content ?? []

    function buildRequestType() {
      if (requestBodyContent.length === 0) return null
      if (requestBodyContent.length === 1) {
        const entry = requestBodyContent[0]!
        if (!entry.schema) return null
        return renderSchemaType({
          schema: {
            ...entry.schema,
            description: node.requestBody!.description ?? entry.schema.description,
          },
          name: resolver.resolveDataName(node),
          keysToOmit: entry.keysToOmit,
        })
      }
      // Multiple content types — generate individual types + union alias
      return buildContentTypeVariants(requestBodyContent, resolver.resolveDataName(node), (schema) => ({
        ...schema,
        description: node.requestBody!.description ?? schema.description,
      }))
    }

    const requestType = buildRequestType()

    const responseTypes = node.responses.map((res) => {
      const variants = (res.content ?? []).filter((entry) => entry.schema)
      // Multiple content types for a single status code — generate a union of the variants.
      if (variants.length > 1) {
        return buildContentTypeVariants(variants, resolver.resolveResponseStatusName(node, res.statusCode))
      }
      const primary = variants[0] ?? res.content?.[0]
      return renderSchemaType({
        schema: primary?.schema ?? null,
        name: resolver.resolveResponseStatusName(node, res.statusCode),
        keysToOmit: primary?.keysToOmit,
      })
    })

    const dataType = renderSchemaType({
      schema: buildData({ ...node, parameters: params }, { resolver }),
      name: resolver.resolveRequestConfigName(node),
    })

    const responsesType = renderSchemaType({
      schema: buildResponses(node, { resolver }),
      name: resolver.resolveResponsesName(node),
    })

    function buildResponseType() {
      const hasSchema = (res: ast.ResponseNode) => (res.content ?? []).some((entry) => entry.schema)
      if (!node.responses.some(hasSchema)) {
        return null
      }

      const responseName = resolver.resolveResponseName(node)

      const responsesWithSchema = node.responses.filter(hasSchema)
      const importedNames = new Set(
        responsesWithSchema.flatMap((res) =>
          (res.content ?? []).flatMap((entry) =>
            entry.schema
              ? adapter
                  .getImports(entry.schema, (schemaName) => ({
                    name: resolveImportName(schemaName),
                    path: '',
                  }))
                  .flatMap((imp) => (Array.isArray(imp.name) ? imp.name : [imp.name]))
              : [],
          ),
        ),
      )

      if (importedNames.has(responseName)) {
        return null
      }

      return renderSchemaType({
        schema: {
          ...buildResponseUnion(node, { resolver })!,
          description: 'Union of all possible responses',
        },
        name: responseName,
      })
    }

    const responseType = buildResponseType()

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        {paramTypes}
        {responseTypes}
        {requestType}
        {dataType}
        {responsesType}
        {responseType}
      </File>
    )
  },
})
