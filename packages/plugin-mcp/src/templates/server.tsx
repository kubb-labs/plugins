import { ast } from '@internals/ast'
import path from 'node:path'
import { getStream } from '@internals/shared'
import { getRelativePath } from '@internals/utils'
import { code, defineTemplate } from '@kubb/kit'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, Raw } from '@kubb/renderer-jsx'
import { Server } from '../components/Server.tsx'
import type { PluginMcp } from '../types.ts'

/**
 * Default v5 server template for `@kubb/plugin-mcp`.
 *
 * Uses individual zod schemas for each param (e.g. `createPetsPathUuidSchema`, `createPetsQueryOffsetSchema`)
 * and `resolveResponseStatusName` for per-status response schemas.
 * Query and header params are composed into `z.object({ ... })` from individual schemas.
 */
export const serverOperations = defineTemplate<PluginMcp>({
  kind: 'Operations',
  render({ operations: nodes }, ctx) {
    const { output } = ctx.options

    const handlers = ctx.from().resolver
    const schemas = ctx.from(pluginZodName).resolver

    const fileAt = <TName extends `${string}.${string}`>(baseName: TName) => ({
      baseName,
      path: path.resolve(ctx.root, output.path, baseName),
      meta: { pluginName: ctx.plugin.name },
    })
    const serverFile = fileAt('server.ts')
    const startFile = fileAt('start.ts')
    const jsonFile = fileAt('.mcp.json')

    // MCP clients spawn the command from their own working directory, usually the project root,
    // so `args` points at `start.ts` relative to `config.root` instead of the `.mcp.json` folder.
    const mcpConfig = {
      mcpServers: {
        [ctx.meta.title || 'server']: {
          type: 'stdio',
          command: 'npx',
          args: ['tsx', getRelativePath(path.resolve(ctx.config.root), startFile.path)],
        },
      },
    }

    // `mcpOperation` emits no handler for a stream operation, so it gets no tool either.
    const operationsMapped = nodes
      .filter(ast.http.isOperation)
      .filter((node) => {
        const stream = getStream(node)
        return !stream?.shape && !stream?.hasVariant
      })
      .map((node) => {
        const { path: pathParams, query: queryParams, header: headerParams, cookie: cookieParams } = ast.http.groupParameters(node)

        const handler = handlers.handler.name(node)
        const request = ast.http.requestBody.getSchema(node) ? schemas.response.body(node) : null
        const successStatus = ast.http.responses.findPrimary(node)?.statusCode
        const response = successStatus ? schemas.response.status(node, successStatus) : null
        const paramRefs = [...pathParams, ...queryParams, ...headerParams, ...cookieParams].map((p) => schemas.param.name(node, p))

        const resolveParams = (params: typeof pathParams) => params.map((p) => ({ name: p.name, schemaName: schemas.param.name(node, p).name }))
        const resolveOptional = (params: typeof pathParams) => (params.length ? resolveParams(params) : null)

        return {
          tool: {
            name: node.operationId,
            title: node.summary || undefined,
            description: node.description || `Make a ${node.method.toUpperCase()} request to ${node.path}`,
          },
          mcp: {
            name: handler.name,
          },
          zod: {
            pathParams: resolveParams(pathParams),
            queryParams: resolveOptional(queryParams),
            headerParams: resolveOptional(headerParams),
            cookieParams: resolveOptional(cookieParams),
            requestName: request?.name ?? null,
            responseName: response?.name ?? null,
          },
          source: code.join([handler, ...paramRefs, request, response]),
        }
      })

    const imports = operationsMapped.flatMap(({ mcp, source }) =>
      source.imports.map((imp) => <File.Import key={`${mcp.name}:${imp.path}`} names={ast.file.getNames(imp)} root={serverFile.path} path={imp.path} />),
    )

    return (
      <>
        <File
          baseName={serverFile.baseName}
          path={serverFile.path}
          meta={serverFile.meta}
          banner={ctx.resolver.default.banner(ctx.meta, { output, config: ctx.config, file: { path: serverFile.path, baseName: serverFile.baseName } })}
          footer={ctx.resolver.default.footer(ctx.meta, { output, config: ctx.config, file: { path: serverFile.path, baseName: serverFile.baseName } })}
        >
          <File.Import names={[{ name: 'McpServer', space: 'value' }]} path={'@modelcontextprotocol/server'} />
          <File.Import names={[{ name: 'serveStdio', space: 'value' }]} path={'@modelcontextprotocol/server/stdio'} />
          <File.Import names={[{ name: 'z', space: 'value' }]} path={'zod'} />

          {imports}
          <Server serverName={ctx.meta.title ?? 'server'} serverVersion={ctx.meta.version ?? '0.0.0'} operations={operationsMapped} />
        </File>

        <File
          baseName={startFile.baseName}
          path={startFile.path}
          meta={startFile.meta}
          banner={ctx.resolver.default.banner(ctx.meta, { output, config: ctx.config, file: { path: startFile.path, baseName: startFile.baseName } })}
          footer={ctx.resolver.default.footer(ctx.meta, { output, config: ctx.config, file: { path: startFile.path, baseName: startFile.baseName } })}
        >
          <File.Import names={[{ name: 'startServer', space: 'value' }]} root={startFile.path} path={serverFile.path} />
          {/* `Raw`, so barrels never re-export this entry: importing it starts the server. */}
          <Raw name="start">{'void startServer()'}</Raw>
        </File>

        <File baseName={jsonFile.baseName} path={jsonFile.path} meta={jsonFile.meta}>
          <Raw name="server">{`${JSON.stringify(mcpConfig, null, 2)}\n`}</Raw>
        </File>
      </>
    )
  },
})
