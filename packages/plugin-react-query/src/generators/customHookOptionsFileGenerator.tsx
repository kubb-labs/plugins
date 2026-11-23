import fs from 'node:fs'
import path from 'node:path'

import { namedFile } from '@internals/shared'
import { hookFileName } from '@internals/tanstack-query'
import { defineTemplate } from '@kubb/kit'
import { File, Function } from '@kubb/renderer-jsx'
import type { PluginReactQuery } from '../types'

/**
 * Scaffolds the user-editable `useCustomHookOptions` file when
 * `pluginReactQuery({ customOptions: { ... }, hooks: true })` is configured. The file is
 * only created when it does not already exist, so user edits persist across
 * regeneration, and only when `importPath` resolves inside the plugin's output folder.
 */
export const customHookOptionsFileOperations = defineTemplate<PluginReactQuery>({
  kind: 'Operations',
  render(nodes, ctx) {
    const { resolver, root } = ctx
    const { output, customOptions, query, hooks } = ctx.options

    // The starter file imports the `HookOptions` type, which is only generated alongside the hooks.
    if (!customOptions || !hooks) return null

    const { importPath, name } = customOptions
    const hookOptionsName = resolver.hook.optionsName()
    const customHookOptionsName = resolver.hook.customOptionsName()

    const reactQueryImportPath = query ? query.importPath : '@tanstack/react-query'

    const outputPath = path.resolve(root, output.path)
    const outputDir = output.mode === 'directory' ? outputPath : path.dirname(outputPath)

    let basePath = outputDir
    const firstNode = nodes[0]
    if (firstNode) {
      const hookFile = ctx.file(firstNode, { name: hookFileName({ resolver, node: firstNode }) })
      basePath = path.dirname(hookFile.path)
    }

    const ensureExtension = (filePath: string, extname: string) => {
      if (path.extname(filePath) === '') return filePath + extname
      return filePath
    }

    const actualFilePath = ensureExtension(importPath, '.ts')
    const file = {
      baseName: path.basename(actualFilePath) as `${string}.${string}`,
      path: path.resolve(basePath, actualFilePath),
    }

    // `importPath` bypasses the resolver's output-folder guard, so apply the same boundary here.
    // A module outside the output folder belongs to the user, who creates it themselves.
    const relativeToOutput = path.relative(outputDir, file.path)
    if (relativeToOutput === '..' || relativeToOutput.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToOutput)) return null

    if (fs.existsSync(file.path)) return null

    // Same path `hookOptionsGenerator` writes the type to, so the import resolves without a root barrel.
    const hookOptionsPath = namedFile({ name: hookOptionsName }).path.replace(/[^/\\]+\.ts$/, `${hookOptionsName}.ts`)

    return (
      <File baseName={file.baseName} path={file.path}>
        <File.Import names={[{ name: 'QueryClient', space: 'type' }]} path={reactQueryImportPath} />
        <File.Import names={[{ name: 'useQueryClient' }]} path={reactQueryImportPath} />
        <File.Import names={[{ name: hookOptionsName, space: 'type' }]} root={file.path} path={hookOptionsPath} />
        <Function name={customHookOptionsName} params="{ queryClient }: { queryClient: QueryClient }" returnType={`Partial<${hookOptionsName}>`}>
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
          generics={`T extends keyof ${hookOptionsName}`}
          params="{ hookName, operationId }: { hookName: T, operationId: string }"
          returnType={`${hookOptionsName}[T]`}
          export
        >
          {`const queryClient = useQueryClient()
            const customOptions = ${customHookOptionsName}({ queryClient })
            return customOptions[hookName] ?? {}`}
        </Function>
      </File>
    )
  },
})
