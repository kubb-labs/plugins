import { ast, defineGenerator, definePlugin } from 'kubb/kit'
import { pluginZodName, type ResolverZod } from '@kubb/plugin-zod'

const operationSchemaType = `{
  readonly request: z.ZodTypeAny | undefined
  readonly parameters: {
    readonly path: z.ZodTypeAny | undefined
    readonly query: z.ZodTypeAny | undefined
    readonly header: z.ZodTypeAny | undefined
  }
  readonly responses: {
    readonly [status: number]: z.ZodTypeAny
    readonly default: z.ZodTypeAny
  }
  readonly errors: {
    readonly [status: number]: z.ZodTypeAny
  }
}`

function renderKey(key: string): string {
  if (/^\d+$/.test(key)) return key
  if (/^[A-Za-z_$][\w$]*$/.test(key)) return key
  return JSON.stringify(key)
}

function renderObject(value: unknown, pad: string): string {
  if (value === null) return 'null'
  if (typeof value !== 'object') return String(value)

  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.length === 0) return '{}'

  const inner = `${pad}  `
  const body = entries
    .map(([key, val]) => {
      const rendered = typeof val === 'string' ? val : renderObject(val, inner)
      return `${inner}${renderKey(key)}: ${rendered}`
    })
    .join(',\n')

  return `{\n${body}\n${pad}}`
}

function buildSchemaNames(node: ast.OperationNode, resolver: ResolverZod) {
  const pathParam = node.parameters.find((p) => p.in === 'path')
  const queryParam = node.parameters.find((p) => p.in === 'query')
  const headerParam = node.parameters.find((p) => p.in === 'header')

  const responses: Record<number | string, string> = {}
  const errors: Record<number | string, string> = {}

  for (const res of node.responses) {
    const statusNum = Number(res.statusCode)
    if (Number.isNaN(statusNum)) continue

    const name = resolver.resolveResponseStatusName(node, res.statusCode)
    responses[statusNum] = name
    if (statusNum >= 400) errors[statusNum] = name
  }

  responses['default'] = resolver.resolveResponseName(node)

  return {
    request: node.requestBody?.content?.[0]?.schema ? resolver.resolveBodyName(node) : null,
    parameters: {
      path: pathParam ? resolver.resolvePathName(node, pathParam) : null,
      query: queryParam ? resolver.resolveQueryName(node, queryParam) : null,
      header: headerParam ? resolver.resolveHeadersName(node, headerParam) : null,
    },
    responses,
    errors,
  }
}

export const pluginZodOperations = definePlugin(() => ({
  name: 'plugin-zod-operations',
  hooks: {
    'kubb:plugin:setup'(ctx) {
      ctx.addGenerator(
        defineGenerator({
          name: 'zod-operations',
          operations(nodes, gctx) {
            const resolver = gctx.getResolver(pluginZodName)
            const zodOptions = gctx.requirePlugin(pluginZodName).options ?? {}
            const output = zodOptions.output ?? { path: 'zod' }
            const group = zodOptions.group ?? undefined
            const importPath = zodOptions.importPath ?? 'zod'

            const operationsFile = resolver.core.file({ name: 'operations', extname: '.ts' }, { root: gctx.root, output, group })
            const transformed = nodes.filter(ast.isHttpOperationNode).map((node) => ({ node, data: buildSchemaNames(node, resolver) }))

            const imports = transformed.flatMap(({ node, data }) => {
              const names = [data.request, ...Object.values(data.responses), ...Object.values(data.parameters)].filter(Boolean) as Array<string>
              const opFile = resolver.core.file(
                { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
                { root: gctx.root, output, group },
              )

              return ast.factory.createImport({ name: names, path: opFile.path, root: operationsFile.path })
            })

            const operations: Record<string, unknown> = {}
            const paths: Record<string, Record<string, string>> = {}
            for (const { node, data } of transformed) {
              operations[node.operationId] = data
              paths[node.path] = { ...(paths[node.path] ?? {}), [node.method]: `operations[${JSON.stringify(node.operationId)}]` }
            }

            return [
              ast.factory.createFile({
                baseName: operationsFile.baseName,
                path: operationsFile.path,
                imports: [ast.factory.createImport({ name: ['z'], path: importPath, isTypeOnly: true }), ...imports],
                sources: [
                  ast.factory.createSource({
                    name: 'OperationSchema',
                    isExportable: true,
                    isIndexable: true,
                    nodes: [ast.factory.createText(`export type OperationSchema = ${operationSchemaType}`)],
                  }),
                  ast.factory.createSource({
                    name: 'OperationsMap',
                    isExportable: true,
                    isIndexable: true,
                    nodes: [ast.factory.createText('export type OperationsMap = Record<string, OperationSchema>')],
                  }),
                  ast.factory.createSource({
                    name: 'operations',
                    isExportable: true,
                    isIndexable: true,
                    nodes: [ast.factory.createText(`export const operations = ${renderObject(operations, '')} as const`)],
                  }),
                  ast.factory.createSource({
                    name: 'paths',
                    isExportable: true,
                    isIndexable: true,
                    nodes: [ast.factory.createText(`export const paths = ${renderObject(paths, '')} as const`)],
                  }),
                ],
              }),
            ]
          },
        }),
      )
    },
  },
}))
