import { ast, defineGenerator } from '@kubb/core'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
import { Type } from '../components/Type.tsx'
import { ENUM_TYPES_WITH_KEY_SUFFIX } from '../constants.ts'
import { printerTs } from '../printers/printerTs.ts'
import type { PluginTs } from '../types'
import { buildData, buildResponses, buildResponseUnion } from '../utils.ts'

function getContentTypeSuffix(contentType: string): string {
  const baseType = contentType.split(';')[0]!.trim()
  if (baseType === 'application/json') return 'Json'
  if (baseType === 'multipart/form-data') return 'FormData'
  if (baseType === 'application/x-www-form-urlencoded') return 'FormUrlEncoded'
  const subtype = baseType.split('/').pop() ?? baseType
  const parts = subtype.split(/[^a-zA-Z0-9]+/).filter(Boolean)
  if (parts.length === 0) return 'Unknown'
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('')
}

function getPerContentTypeName(dataName: string, suffix: string): string {
  if (dataName.endsWith('Data')) {
    return suffix.endsWith('Data') ? dataName.slice(0, -4) + suffix : `${dataName.slice(0, -4)}${suffix}Data`
  }
  return dataName + suffix
}

/**
 * Built-in generator for `@kubb/plugin-ts`. Emits one TypeScript file per
 * schema in the spec plus per-operation request, response, and parameter
 * types. Drop-replace with a custom `Generator<PluginTs>` to change how
 * TypeScript output is produced.
 */
export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  renderer: jsxRendererSync,
  schema(node, ctx) {
    const { enumType, enumTypeSuffix, enumKeyCasing, syntaxType, optionalType, arrayType, output, group, printer } = ctx.options
    const { adapter, config, resolver, root } = ctx

    if (!node.name) {
      return
    }
    const mode = ctx.getMode(output)
    // Build a set of schema names that are enums so the ref handler and getImports
    // callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = new Set<string>(ctx.meta.enumNames)

    function resolveImportName(schemaName: string): string {
      if (ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && enumTypeSuffix && enumSchemaNames.has(schemaName)) {
        return resolver.resolveEnumKeyName({ name: schemaName }, enumTypeSuffix)
      }
      return resolver.resolveTypeName(schemaName)
    }

    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolveImportName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group: group ?? undefined }).path,
    }))

    const isEnumSchema = !!ast.narrowSchema(node, ast.schemaTypes.enum)

    const meta = {
      name: ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && isEnumSchema ? resolver.resolveEnumKeyName(node, enumTypeSuffix) : resolver.resolveTypeName(node.name),
      file: resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group: group ?? undefined }),
    } as const

    const schemaPrinter = printerTs({
      optionalType,
      arrayType,
      enumType,
      enumTypeSuffix,
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
        {mode === 'split' &&
          imports.map((imp) => (
            <File.Import key={[node.name, imp.path, imp.isTypeOnly].join('-')} root={meta.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}
        <Type
          name={meta.name}
          node={node}
          enumType={enumType}
          enumTypeSuffix={enumTypeSuffix}
          enumKeyCasing={enumKeyCasing}
          resolver={resolver}
          printer={schemaPrinter}
        />
      </File>
    )
  },
  operation(node, ctx) {
    const { enumType, enumTypeSuffix, enumKeyCasing, optionalType, arrayType, syntaxType, paramsCasing, group, output, printer } = ctx.options
    const { adapter, config, resolver, root } = ctx

    const mode = ctx.getMode(output)

    const params = ast.caseParams(node.parameters, paramsCasing)

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
      if (ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && enumTypeSuffix && enumSchemaNames.has(schemaName)) {
        return resolver.resolveEnumKeyName({ name: schemaName }, enumTypeSuffix)
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
        enumType,
        enumTypeSuffix,
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
          {mode === 'split' &&
            imports.map((imp) => (
              <File.Import key={[name, imp.path, imp.isTypeOnly].join('-')} root={meta.file.path} path={imp.path} name={imp.name} isTypeOnly />
            ))}
          <Type
            name={name}
            node={schema}
            enumType={enumType}
            enumTypeSuffix={enumTypeSuffix}
            enumKeyCasing={enumKeyCasing}
            resolver={resolver}
            printer={schemaPrinter}
          />
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
      const usedNames = new Set<string>()
      const individualItems = entries
        .filter((entry) => entry.schema)
        .map((entry) => {
          const baseSuffix = getContentTypeSuffix(entry.contentType)
          let individualName = getPerContentTypeName(baseName, baseSuffix)
          let counter = 2
          while (usedNames.has(individualName)) {
            individualName = getPerContentTypeName(baseName, `${baseSuffix}${counter++}`)
          }
          usedNames.add(individualName)
          return {
            name: individualName,
            rendered: renderSchemaType({
              schema: decorate ? decorate(entry.schema!) : entry.schema!,
              name: individualName,
              keysToOmit: entry.keysToOmit,
            }),
          }
        })
      const unionSchema = ast.createSchema({
        type: 'union',
        members: individualItems.map((item) => ast.createSchema({ type: 'ref', name: item.name })),
      })
      return (
        <>
          {individualItems.map((item) => item.rendered)}
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
      const primary = res.content?.[0]
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
