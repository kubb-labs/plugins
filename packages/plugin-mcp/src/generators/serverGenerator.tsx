import path from 'node:path'
import { getOperationParameters, getPrimarySuccessResponse, operationFileEntry } from '@internals/shared'
import { getRelativePath } from '@internals/utils'
import { ast, defineGenerator } from '@kubb/kit'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Server } from '../components/Server.tsx'
import type { PluginMcp } from '../types.ts'

/**
 * Default v5 server generator for `@kubb/plugin-mcp`.
 *
 * Uses individual zod schemas for each param (e.g. `createPetsPathUuidSchema`, `createPetsQueryOffsetSchema`)
 * and `resolveResponseStatusName` for per-status response schemas.
 * Query and header params are composed into `z.object({ ... })` from individual schemas.
 */
export const serverGenerator = defineGenerator<PluginMcp>({
  name: 'operations',
  renderer: jsxRenderer,
  operations(nodes, ctx) {
    const { config, resolver, plugin, driver, root } = ctx
    const { output, group } = ctx.options

    const pluginZod = ctx.requirePlugin(pluginZodName)

    const zodResolver = driver.getResolver(pluginZodName)

    const fileAt = <TName extends `${string}.${string}`>(baseName: TName) => ({
      baseName,
      path: path.resolve(root, output.path, baseName),
      meta: { pluginName: plugin.name },
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
          args: ['tsx', getRelativePath(path.resolve(config.root), startFile.path)],
        },
      },
    }

    const operationsMapped = nodes.filter(ast.isHttpOperationNode).map((node) => {
      const { path: pathParams, query: queryParams, header: headerParams } = getOperationParameters(node)

      const fileEntry = operationFileEntry(node, node.operationId)
      const mcpFile = resolver.file({ ...fileEntry, root, output, group: group ?? undefined })
      const zodFile = zodResolver.file({
        ...fileEntry,
        root,
        output: pluginZod.options?.output ?? output,
        group: pluginZod.options?.group ?? undefined,
      })

      const requestName = node.requestBody?.content?.[0]?.schema ? zodResolver.response.body(node) : null
      const successStatus = getPrimarySuccessResponse(node)?.statusCode
      const responseName = successStatus ? zodResolver.response.status(node, successStatus) : null

      const resolveParams = (params: typeof pathParams) => params.map((p) => ({ name: p.name, schemaName: zodResolver.param.name(node, p) }))

      return {
        tool: {
          name: node.operationId,
          title: node.summary || undefined,
          description: node.description || `Make a ${node.method.toUpperCase()} request to ${node.path}`,
        },
        mcp: {
          name: resolver.handler.name(node),
          file: mcpFile,
        },
        zod: {
          pathParams: resolveParams(pathParams),
          queryParams: queryParams.length ? resolveParams(queryParams) : null,
          headerParams: headerParams.length ? resolveParams(headerParams) : null,
          requestName,
          responseName,
          file: zodFile,
        },
      }
    })

    const imports = operationsMapped.flatMap(({ mcp, zod }) => {
      const zodNames = [
        ...zod.pathParams.map((p) => p.schemaName),
        ...(zod.queryParams ?? []).map((p) => p.schemaName),
        ...(zod.headerParams ?? []).map((p) => p.schemaName),
        zod.requestName,
        zod.responseName,
      ].filter((name): name is string => Boolean(name))

      const uniqueNames = [...new Set(zodNames)].sort()

      return [
        <File.Import key={mcp.name} name={[mcp.name]} root={serverFile.path} path={mcp.file.path} />,
        uniqueNames.length > 0 && <File.Import key={`zod-${mcp.name}`} name={uniqueNames} root={serverFile.path} path={zod.file.path} />,
      ].filter(Boolean)
    })

    return (
      <>
        <File
          baseName={serverFile.baseName}
          path={serverFile.path}
          meta={serverFile.meta}
          banner={resolver.default.banner(ctx.meta, { output, config, file: { path: serverFile.path, baseName: serverFile.baseName } })}
          footer={resolver.default.footer(ctx.meta, { output, config, file: { path: serverFile.path, baseName: serverFile.baseName } })}
        >
          <File.Import name={['McpServer']} path={'@modelcontextprotocol/server'} />
          <File.Import name={['serveStdio']} path={'@modelcontextprotocol/server/stdio'} />
          <File.Import name={['z']} path={'zod'} />

          {imports}
          <Server serverName={ctx.meta.title ?? 'server'} serverVersion={ctx.meta.version ?? '0.0.0'} operations={operationsMapped} />
        </File>

        <File
          baseName={startFile.baseName}
          path={startFile.path}
          meta={startFile.meta}
          banner={resolver.default.banner(ctx.meta, { output, config, file: { path: startFile.path, baseName: startFile.baseName } })}
          footer={resolver.default.footer(ctx.meta, { output, config, file: { path: startFile.path, baseName: startFile.baseName } })}
        >
          <File.Import name={['startServer']} root={startFile.path} path={serverFile.path} />
          {/* Not indexable: barrels must not re-export this entry, importing it starts the server. */}
          <File.Source name="start">{'void startServer()'}</File.Source>
        </File>

        <File baseName={jsonFile.baseName} path={jsonFile.path} meta={jsonFile.meta}>
          <File.Source name="server">{`${JSON.stringify(mcpConfig, null, 2)}\n`}</File.Source>
        </File>
      </>
    )
  },
})
