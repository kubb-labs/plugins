import fs from 'node:fs'
import path from 'node:path'

import { defineGenerator } from '@kubb/core'
import { File, Function, jsxRenderer } from '@kubb/renderer-jsx'
import type { PluginReactQuery } from '../types'
import { transformName } from '../utils.ts'

export const customHookOptionsFileGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-query-custom-hook-options-file',
  renderer: jsxRenderer,
  operations(nodes, ctx) {
    const { resolver, config, root } = ctx
    const { output, customOptions, query, group, transformers } = ctx.options

    if (!customOptions) return null

    const override = output.override ?? config.output.override ?? false
    const { importPath, name } = customOptions

    const reactQueryImportPath = query ? query.importPath : '@tanstack/react-query'

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

    let hookFilePath: string
    const firstNode = nodes[0]
    if (firstNode) {
      const baseName = resolver.resolveName(firstNode.operationId)
      const hookName = transformName(`use${capitalize(baseName)}`, 'function', transformers)
      const hookFile = resolver.resolveFile(
        { name: hookName, extname: '.ts', tag: firstNode.tags[0] ?? 'default', path: firstNode.path },
        { root, output, group },
      )
      hookFilePath = hookFile.path
    } else {
      hookFilePath = path.resolve(root, 'index.ts')
    }

    const ensureExtension = (filePath: string, extname: string) => {
      if (path.extname(filePath) === '') return filePath + extname
      return filePath
    }

    const basePath = path.dirname(hookFilePath)
    const actualFilePath = ensureExtension(importPath, '.ts')
    const file = {
      baseName: path.basename(actualFilePath) as `${string}.${string}`,
      name: path.basename(actualFilePath, path.extname(actualFilePath)),
      path: path.resolve(basePath, actualFilePath),
    }

    if (fs.existsSync(file.path) && !override) return null

    return (
      <File baseName={file.baseName} path={file.path}>
        <File.Import name={['QueryClient']} path={reactQueryImportPath} isTypeOnly />
        <File.Import name={['useQueryClient']} path={reactQueryImportPath} />
        <File.Import name={['HookOptions']} root={file.path} path={path.resolve(root, './index.ts')} />
        <File.Source name={file.name} isExportable isIndexable>
          <Function name="getCustomHookOptions" params="{ queryClient }: { queryClient: QueryClient }" returnType="Partial<HookOptions>">
            {`return {
              // TODO: Define custom hook options here
              // Example:
              // useUpdatePetHook: {
              //   onSuccess: () => {
              //     void queryClient.invalidateQueries({ queryKey: ['pet'] })
              //   }
              // }
            }`}
          </Function>
          <Function
            name={name}
            generics="T extends keyof HookOptions"
            params="{ hookName, operationId }: { hookName: T, operationId: string }"
            returnType="HookOptions[T]"
            export
          >
            {`const queryClient = useQueryClient()
            const customOptions = getCustomHookOptions({ queryClient })
            return customOptions[hookName] ?? {}`}
          </Function>
        </File.Source>
      </File>
    )
  },
})
