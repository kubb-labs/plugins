import { caseParams, getOasAdapter, getOperationParameters, getPerContentTypeName, resolveContentTypeVariants } from '@internals/shared'
import { aliasConflictingImports, filterUsedImports, rewriteAliasedImports } from '@internals/utils'
import { ast, defineGenerator } from 'kubb/kit'
import { buildParams, pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { Faker } from '../components/Faker.tsx'
import { printerFaker } from '../printers/printerFaker.ts'
import type { PluginFaker } from '../types.ts'
import { buildResponseUnionSchema, canOverrideSchema, localeToFakerImport, resolveTypeReference } from '../utils.ts'

/**
 * Built-in generator for `@kubb/plugin-faker`. Emits one `createX` factory
 * per schema in the spec plus per-operation request/response factories. Each
 * factory returns a value matching the corresponding TypeScript type from
 * `@kubb/plugin-ts`.
 */
export const fakerGenerator = defineGenerator<PluginFaker>({
  name: 'faker',
  renderer: jsxRenderer,
  schema(node, ctx) {
    const { adapter, config, resolver, root } = ctx
    const { output, group, dateParser, regexGenerator, seed, locale, printer } = ctx.options
    const pluginTs = ctx.driver.getPlugin(pluginTsName)

    if (!node.name || !pluginTs) {
      return
    }

    const tsResolver = ctx.driver.getResolver(pluginTsName)

    const schemaName = node.name
    const isEnumSchema = !!ast.narrowSchema(node, ast.schemaTypes.enum)
    const tsEnumType = pluginTs.options?.enum?.type
    const tsEnumTypeSuffix = pluginTs.options?.enum?.typeSuffix ?? 'Key'
    const schemaTypeName =
      isEnumSchema && tsEnumType === 'asConst' ? tsResolver.enum.keyName({ name: schemaName }, tsEnumTypeSuffix) : tsResolver.name(schemaName)
    const meta = {
      name: resolver.name(schemaName),
      file: resolver.file({ name: schemaName, extname: '.ts', root, output, group: group ?? undefined }),
      typeName: schemaTypeName,
      typeFile: tsResolver.file({
        name: schemaName,
        extname: '.ts',
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
    } as const
    const canOverride = canOverrideSchema(node)
    const cyclicSchemas = new Set<string>(ctx.meta.circularNames)
    const printerInstance = printerFaker({
      resolver,
      schemaName,
      typeName: meta.typeName,
      dateParser,
      regexGenerator,
      nodes: printer?.nodes,
      cyclicSchemas,
      nameMapping: getOasAdapter(adapter).options.nameMapping,
    })
    const fakerText = printerInstance.print(node) ?? 'undefined'
    const typeReference = resolveTypeReference({
      node,
      canOverride,
      name: meta.name,
      typeName: meta.typeName,
      filePath: meta.file.path,
      typeFilePath: meta.typeFile.path,
    })

    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolver.name(schemaName),
      path: resolver.file({ name: schemaName, extname: '.ts', root, output, group: group ?? undefined }).path,
    }))
    const usedImports = filterUsedImports(imports, fakerText)

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={locale ? [{ propertyName: localeToFakerImport(locale), name: 'faker' }] : ['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser !== 'faker' && <File.Import path={dateParser} name={dateParser} />}
        {typeReference.importPath && <File.Import isTypeOnly root={meta.file.path} path={typeReference.importPath} name={[meta.typeName]} />}
        {usedImports.map((imp) => (
          <File.Import key={[schemaName, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
        ))}
        <Faker
          name={meta.name}
          typeName={typeReference.typeName}
          description={node.description}
          node={node}
          printer={printerInstance}
          seed={seed}
          canOverride={canOverride}
        />
      </File>
    )
  },
  operation(node, ctx) {
    const { adapter, config, resolver, root } = ctx
    const { output, group, dateParser, regexGenerator, seed, locale, printer } = ctx.options
    const pluginTs = ctx.driver.getPlugin(pluginTsName)

    if (!pluginTs) {
      return
    }

    const tsResolver = ctx.driver.getResolver(pluginTsName)

    const params = caseParams(node.parameters, 'camelcase')
    const { path: pathParams, query: queryParams, header: headerParams } = getOperationParameters({ ...node, parameters: params }, { paramsCasing: 'original' })
    const paramGroups = (
      [
        { params: pathParams, name: resolver.param.path, typeName: tsResolver.param.path },
        { params: queryParams, name: resolver.param.query, typeName: tsResolver.param.query },
        { params: headerParams, name: resolver.param.headers, typeName: tsResolver.param.headers },
      ] as const
    )
      .filter((group) => group.params.length > 0)
      .map((group) => ({
        schema: buildParams({ params: group.params }),
        name: group.name(node, group.params[0]!),
        typeName: group.typeName(node, group.params[0]!),
      }))
    type RenderUnit = { schema: ast.SchemaNode | null; name: string; typeName: string; description?: string; skipImportNames: Array<string> }

    // Expands a content array into render units: one faker per content type plus a union faker
    // (named `baseName`) when more than one content type carries a schema, else a single faker.
    function expandContentUnits(
      entries: Array<{ contentType: string; schema?: ast.SchemaNode | null }>,
      baseName: string,
      tsBaseName: string,
      description: string | undefined,
      decorate?: (schema: ast.SchemaNode) => ast.SchemaNode,
    ): Array<RenderUnit> {
      const withSchema = entries.filter((entry) => entry.schema)
      if (withSchema.length <= 1) {
        const primary = withSchema[0] ?? entries[0]
        if (!primary?.schema) return []
        return [{ schema: decorate ? decorate(primary.schema) : primary.schema, name: baseName, typeName: tsBaseName, description, skipImportNames: [] }]
      }
      const variants = resolveContentTypeVariants(entries, baseName)
      const unionSchema = ast.factory.createSchema({
        type: 'union',
        members: variants.map((variant) => ast.factory.createSchema({ type: 'ref', name: variant.name })),
      })
      return [
        ...variants.map((variant) => ({
          schema: decorate ? decorate(variant.schema) : variant.schema,
          name: variant.name,
          typeName: getPerContentTypeName(tsBaseName, variant.suffix),
          description,
          skipImportNames: [],
        })),
        { schema: unionSchema, name: baseName, typeName: tsBaseName, description, skipImportNames: variants.map((variant) => variant.name) },
      ]
    }

    const responseUnits = node.responses.flatMap((response) =>
      expandContentUnits(
        response.content ?? [],
        resolver.response.status(node, response.statusCode),
        tsResolver.response.status(node, response.statusCode),
        response.description,
      ),
    )
    const dataUnits = expandContentUnits(
      node.requestBody?.content ?? [],
      resolver.response.body(node),
      tsResolver.response.body(node),
      node.requestBody?.description,
      (schema) => ({ ...schema, description: node.requestBody?.description ?? schema.description }),
    )
    const responseName = resolver.response.response(node)
    const localHelperNames = new Set([
      ...paramGroups.map((group) => group.name),
      ...responseUnits.map((unit) => unit.name),
      ...dataUnits.map((unit) => unit.name),
      responseName,
    ])
    const cyclicSchemas = new Set<string>(ctx.meta.circularNames)

    const meta = {
      file: resolver.file({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path, root, output, group: group ?? undefined }),
      typeFile: tsResolver.file({
        name: node.operationId,
        extname: '.ts',
        tag: node.tags[0] ?? 'default',
        path: node.path,
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
    } as const

    function resolveMockImports(schema: ast.SchemaNode) {
      return adapter
        .getImports(schema, (schemaName) => ({
          name: resolver.name(schemaName),
          path: resolver.file({ name: schemaName, extname: '.ts', root, output, group: group ?? undefined }).path,
        }))
        .filter((entry) => entry.path !== meta.file.path)
    }

    function renderEntry({
      schema,
      name,
      typeName,
      description,
      skipImportNames = [],
    }: {
      schema: ast.SchemaNode | null
      name: string
      typeName: string
      description?: string
      skipImportNames?: Array<string>
    }) {
      if (!schema) {
        return null
      }

      const canOverride = canOverrideSchema(schema)
      const printerInstance = printerFaker({
        resolver,
        schemaName: name,
        typeName,
        dateParser,
        regexGenerator,
        nodes: printer?.nodes,
        cyclicSchemas,
        nameMapping: getOasAdapter(adapter).options.nameMapping,
      })
      const fakerText = printerInstance.print(schema) ?? 'undefined'
      const usedImports = filterUsedImports(resolveMockImports(schema), fakerText, skipImportNames)
      const { imports, aliases } = aliasConflictingImports(usedImports, localHelperNames)
      const rewrittenFakerText = rewriteAliasedImports(fakerText, aliases)
      const typeReference = resolveTypeReference({
        node: schema,
        canOverride,
        name,
        typeName,
        filePath: meta.file.path,
        typeFilePath: meta.typeFile.path,
      })

      return (
        <>
          {typeReference.importPath && <File.Import isTypeOnly root={meta.file.path} path={typeReference.importPath} name={[typeName]} />}
          {imports.map((imp) => (
            <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
          ))}
          <Faker
            name={name}
            typeName={typeReference.typeName}
            description={description}
            node={schema}
            printer={{ ...printerInstance, print: () => rewrittenFakerText }}
            seed={seed}
            canOverride={canOverride}
          />
        </>
      )
    }

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={locale ? [{ propertyName: localeToFakerImport(locale), name: 'faker' }] : ['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser !== 'faker' && <File.Import path={dateParser} name={dateParser} />}
        {paramGroups.map((group) => renderEntry(group))}
        {responseUnits.map((unit) =>
          renderEntry({
            schema: unit.schema,
            name: unit.name,
            typeName: unit.typeName,
            description: unit.description,
            skipImportNames: unit.skipImportNames,
          }),
        )}
        {dataUnits.map((unit) =>
          renderEntry({
            schema: unit.schema,
            name: unit.name,
            typeName: unit.typeName,
            description: unit.description,
            skipImportNames: unit.skipImportNames,
          }),
        )}
        {renderEntry({
          schema: buildResponseUnionSchema(node, resolver),
          name: responseName,
          typeName: tsResolver.response.response(node),
          skipImportNames: responseUnits.map((unit) => unit.name),
        })}
      </File>
    )
  },
})
