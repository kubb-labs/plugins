import { getOperationSuccessResponses, groupOperationTypeImports, resolveResponseTypes } from '@internals/shared'
import { ast, defineGenerator } from 'kubb/kit'
import { pluginFakerName } from '@kubb/plugin-faker'
import { enumTypeName, pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { Mock } from '../components/Mock.tsx'
import { Response } from '../components/Response.tsx'
import type { PluginMsw } from '../types'
import { hasResponseSchema } from '../utils.ts'

/**
 * Built-in operation generator for `@kubb/plugin-msw`. Emits one MSW handler
 * per OpenAPI operation. With `parser: 'faker'` the handler returns a value
 * from `@kubb/plugin-faker`; with `parser: 'data'` it returns a typed empty
 * payload for tests to fill in.
 */
export const mswGenerator = defineGenerator<PluginMsw>({
  name: 'msw',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { driver, resolver, config, root } = ctx
    const { output, parser, baseURL, group } = ctx.options

    const fileName = resolver.name(node.operationId)
    const mock = {
      name: resolver.handler.name(node),
      file: resolver.file({ name: fileName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path, root, output, group: group ?? undefined }),
    }

    const fakerPlugin = parser === 'faker' ? ctx.requirePlugin(pluginFakerName) : null
    const fakerResolver = fakerPlugin ? driver.getResolver(pluginFakerName) : null
    const faker =
      fakerPlugin && fakerResolver
        ? {
            name: fakerResolver.response.response(node),
            file: fakerResolver.file({
              name: node.operationId,
              extname: '.ts',
              tag: node.tags[0] ?? 'default',
              path: node.path,
              root,
              output: fakerPlugin.options?.output ?? output,
              group: fakerPlugin.options?.group ?? undefined,
            }),
          }
        : null

    const pluginTs = ctx.requirePlugin(pluginTsName)
    const tsResolver = driver.getResolver(pluginTsName)

    const type = { responseName: tsResolver.response.response(node) }

    const successResponses = getOperationSuccessResponses(node)
    const referencedNames = node.responses.flatMap((response) =>
      (response.content ?? []).flatMap((entry) => (entry.schema ? ast.collectImportedRefNames(entry.schema) : [])),
    )
    const enumOptions = pluginTs.options?.enum
    const enumNames = new Set(ctx.meta.enumNames)
    // A type printed by `pluginTs({ operations: 'inline' })` is the referenced schema itself, not a colliding alias.
    const hasResponseNameCollision =
      pluginTs.options?.operations !== 'inline' &&
      referencedNames.some((name) => {
        return enumTypeName({ resolver: tsResolver, name, enumOptions, isEnum: enumNames.has(name) }) === type.responseName
      })
    const types = resolveResponseTypes(node, tsResolver).map(([code, typeName]) => {
      const successResponse = successResponses.find((response) => response.statusCode === String(code))
      return [code, hasResponseNameCollision && successResponse ? tsResolver.response.status(node, successResponse.statusCode) : typeName] as const
    })
    const responseTypeNames = types.map(([, typeName]) => typeName).filter((name) => !hasResponseNameCollision || name !== type.responseName)
    const mockResponseName =
      hasResponseNameCollision && successResponses[0] ? tsResolver.response.status(node, successResponses[0].statusCode) : type.responseName
    const hasSuccessSchema = successResponses.some((response) => hasResponseSchema(response))

    const requestName = node.requestBody?.content?.[0]?.schema ? tsResolver.response.body(node) : null

    return (
      <File
        baseName={mock.file.baseName}
        path={mock.file.path}
        meta={mock.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: mock.file.path, baseName: mock.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: mock.file.path, baseName: mock.file.baseName } })}
      >
        <File.Import name={['http', 'HttpResponse']} path="msw/http" />
        <File.Import name={['HttpResponseResolver']} isTypeOnly path="msw/http" />
        {groupOperationTypeImports(
          node,
          [...(hasResponseNameCollision ? [] : [type.responseName]), ...responseTypeNames, ...(requestName ? [requestName] : [])],
          {
            resolver: tsResolver,
            root,
            output: pluginTs.options?.output ?? output,
            group: pluginTs.options?.group,
          },
        ).map((imp) => (
          <File.Import key={imp.path} name={imp.names} path={imp.path} root={mock.file.path} isTypeOnly />
        ))}
        {faker && hasSuccessSchema && <File.Import name={[faker.name]} root={mock.file.path} path={faker.file.path} />}

        {types
          .filter(([code]) => code !== 'default')
          .map(([code, typeName]) => {
            const response = node.responses.find((item) => item.statusCode === String(code))
            if (!response) return null
            return <Response key={typeName} typeName={typeName} response={response} name={mock.name} />
          })}

        <Mock
          name={mock.name}
          typeName={mockResponseName}
          requestTypeName={requestName}
          fakerName={faker && hasSuccessSchema ? faker.name : undefined}
          node={node}
          baseURL={baseURL}
        />
      </File>
    )
  },
})
