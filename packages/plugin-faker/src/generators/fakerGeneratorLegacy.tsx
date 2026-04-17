import { ast, defineGenerator } from '@kubb/core'
import { type PluginTs, pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Faker } from '../components/Faker.tsx'
import { printerFaker } from '../printers/printerFaker.ts'
import type { PluginFaker } from '../types.ts'
import {
  aliasConflictingImports,
  buildGroupedParamsSchema,
  buildLegacyResponseUnionSchema,
  canOverrideSchema,
  filterUsedImports,
  resolveSchemaRef,
  resolveTypeReference,
  rewriteAliasedImports,
} from '../utils.ts'

export const fakerGeneratorLegacy = defineGenerator<PluginFaker>({
  name: 'faker-legacy',
  renderer: jsxRenderer,
  schema(node, ctx) {
    const { adapter, config, resolver, root } = ctx
    const { output, group, dateParser, regexGenerator, mapper, seed, printer } = ctx.options
    const pluginTs = ctx.driver.getPlugin<PluginTs>(pluginTsName)

    if (!node.name || !pluginTs?.resolver || !adapter.inputNode) {
      return
    }

    const schemaNode = resolveSchemaRef(node, adapter.inputNode.schemas)
    const schemaName = schemaNode.name ?? node.name
    const mode = ctx.getMode(output)
    const meta = {
      name: resolver.resolveName(schemaName),
      file: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }),
      typeName: pluginTs.resolver.resolveTypeName(schemaName),
      typeFile: pluginTs.resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output: pluginTs.options.output, group: pluginTs.options.group }),
    } as const
    const canOverride = canOverrideSchema(schemaNode)
    const printerInstance = printerFaker({
      resolver,
      schemaName,
      typeName: meta.typeName,
      dateParser,
      regexGenerator,
      mapper,
      nodes: printer?.nodes,
    })
    const fakerText = printerInstance.print(schemaNode) ?? 'undefined'
    const typeReference = resolveTypeReference({
      node: schemaNode,
      canOverride,
      name: meta.name,
      typeName: meta.typeName,
      filePath: meta.file.path,
      typeFilePath: meta.typeFile.path,
    })

    const imports = adapter
      .getImports(schemaNode, (schemaName) => ({
        name: resolver.resolveName(schemaName),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
      }))
      .filter((entry) => entry.path !== meta.file.path)
    const usedImports = filterUsedImports(imports, fakerText)

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <File.Import name={['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser !== 'faker' && <File.Import path={dateParser} name={dateParser} />}
        {typeReference.importPath && <File.Import isTypeOnly root={meta.file.path} path={typeReference.importPath} name={[meta.typeName]} />}
        {mode === 'split' &&
          usedImports.map((imp) => <File.Import key={[schemaName, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}
        <Faker
          name={meta.name}
          typeName={typeReference.typeName}
          description={schemaNode.description}
          node={schemaNode}
          printer={printerInstance}
          seed={seed}
          canOverride={canOverride}
        />
      </File>
    )
  },
  operation(node, ctx) {
    const { adapter, config, resolver, root } = ctx
    const { output, group, paramsCasing, dateParser, regexGenerator, mapper, seed, printer } = ctx.options
    const pluginTs = ctx.driver.getPlugin<PluginTs>(pluginTsName)

    if (!pluginTs?.resolver) {
      return
    }

    const params = ast.caseParams(node.parameters, paramsCasing)
    const pathParams = params.filter((param) => param.in === 'path')
    const queryParams = params.filter((param) => param.in === 'query')
    const headerParams = params.filter((param) => param.in === 'header')
    const pathParamsEntry = pathParams[0]
      ? {
          schema: buildGroupedParamsSchema(pathParams),
          name: resolver.resolvePathParamsName(node, pathParams[0]),
          typeName: pluginTs.resolver.resolvePathParamsName(node, pathParams[0]),
        }
      : null
    const queryParamsEntry = queryParams[0]
      ? {
          schema: buildGroupedParamsSchema(queryParams),
          name: resolver.resolveQueryParamsName(node, queryParams[0]),
          typeName: pluginTs.resolver.resolveQueryParamsName(node, queryParams[0]),
        }
      : null
    const headerParamsEntry = headerParams[0]
      ? {
          schema: buildGroupedParamsSchema(headerParams),
          name: resolver.resolveHeaderParamsName(node, headerParams[0]),
          typeName: pluginTs.resolver.resolveHeaderParamsName(node, headerParams[0]),
        }
      : null
    const responseEntries = node.responses.map((response) => ({
      response,
      name: resolver.resolveResponseStatusName(node, response.statusCode),
      typeName: pluginTs.resolver.resolveResponseStatusName(node, response.statusCode),
    }))
    const dataEntry = node.requestBody?.schema
      ? {
          schema: {
            ...node.requestBody.schema,
            description: node.requestBody.description ?? node.requestBody.schema.description,
          },
          name: resolver.resolveDataName(node),
          typeName: pluginTs.resolver.resolveDataName(node),
          description: node.requestBody.description ?? node.requestBody.schema.description,
        }
      : null
    const responseName = resolver.resolveResponseName(node)
    const localHelperNames = new Set([
      ...(pathParamsEntry ? [pathParamsEntry.name] : []),
      ...(queryParamsEntry ? [queryParamsEntry.name] : []),
      ...(headerParamsEntry ? [headerParamsEntry.name] : []),
      ...responseEntries.map((entry) => entry.name),
      ...(dataEntry ? [dataEntry.name] : []),
      responseName,
    ])
    const meta = {
      file: resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
      typeFile: pluginTs.resolver.resolveFile(
        {
          name: node.operationId,
          extname: '.ts',
          tag: node.tags[0] ?? 'default',
          path: node.path,
        },
        {
          root,
          output: pluginTs.options.output,
          group: pluginTs.options.group,
        },
      ),
    } as const

    function resolveMockImports(schema: ast.SchemaNode) {
      return adapter
        .getImports(schema, (schemaName) => ({
          name: resolver.resolveName(schemaName),
          path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
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
        mapper,
        nodes: printer?.nodes,
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
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <File.Import name={['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser !== 'faker' && <File.Import path={dateParser} name={dateParser} />}
        {pathParamsEntry &&
          renderEntry({
            schema: pathParamsEntry.schema,
            name: pathParamsEntry.name,
            typeName: pathParamsEntry.typeName,
          })}
        {queryParamsEntry &&
          renderEntry({
            schema: queryParamsEntry.schema,
            name: queryParamsEntry.name,
            typeName: queryParamsEntry.typeName,
          })}
        {headerParamsEntry &&
          renderEntry({
            schema: headerParamsEntry.schema,
            name: headerParamsEntry.name,
            typeName: headerParamsEntry.typeName,
          })}
        {responseEntries.map(({ response, name, typeName }) =>
          renderEntry({
            schema: response.schema,
            name,
            typeName,
            description: response.description,
          }),
        )}
        {dataEntry
          ? renderEntry({
              schema: dataEntry.schema,
              name: dataEntry.name,
              typeName: dataEntry.typeName,
              description: dataEntry.description,
            })
          : null}
        {renderEntry({
          schema: buildLegacyResponseUnionSchema(node, resolver),
          name: responseName,
          typeName: pluginTs.resolver.resolveResponseName(node),
          skipImportNames: responseEntries.map(({ name }) => name),
        })}
      </File>
    )
  },
})
