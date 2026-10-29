import fs from 'node:fs'
import path from 'node:path'

import { defineGenerator } from '@kubb/kit'
import { File, Function, jsxRenderer } from '@kubb/renderer-jsx'
import type { PluginReactQuery } from '../types'

/**
 * Scaffolds the user-editable `useCustomHookOptions` file when
 * `pluginReactQuery({ customOptions: { ... }, hooks: true })` is configured. The file is
 * only created when it does not already exist, so user edits persist across
 * regeneration, and only when `importPath` resolves inside the plugin's output folder.
 */
export const customHookOptionsFileGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-query-custom-hook-options-file',
  renderer: jsxRenderer,
  operations(nodes, ctx) {
    const { resolver, root } = ctx
    const { output, customOptions, query, group, hooks } = ctx.options

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
      const hookName = resolver.query.name(firstNode)
      const hookFile = resolver.file({
        name: hookName,
        extname: '.ts',
        tag: firstNode.tags[0] ?? 'default',
        path: firstNode.path,
        root,
        output,
        group: group ?? undefined,
      })
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

    return (
      <File baseName={file.baseName} path={file.path}>
        <File.Import name={['QueryClient']} path={reactQueryImportPath} isTypeOnly />
        <File.Import name={['useQueryClient']} path={reactQueryImportPath} />
        <File.Import name={[hookOptionsName]} root={file.path} path={path.resolve(root, './index.ts')} />
        <File.Source name={name} isExportable isIndexable>
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
        </File.Source>
      </File>
    )
  },
})
