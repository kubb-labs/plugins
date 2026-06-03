import path from 'node:path'
import { camelCase } from '@internals/utils'
import { type ast, FileProcessor, memoryStorage } from '@kubb/core'
import { createMockedPluginDriver } from '@kubb/core/mocks'
import { parserTs } from '@kubb/parser-ts'
import type { Options } from 'prettier'
import { format as prettierFormat } from 'prettier'
import pluginTypescript from 'prettier/plugins/typescript'
import { expect } from 'vitest'

const formatOptions: Options = {
  tabWidth: 2,
  printWidth: 160,
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  bracketSameLine: false,
  endOfLine: 'auto',
  plugins: [pluginTypescript],
}

export async function format(source?: string): Promise<string> {
  if (!source) return ''
  try {
    return prettierFormat(source, formatOptions)
  } catch {
    return source
  }
}

export const mockedPluginDriver = createMockedPluginDriver()

export async function matchFiles(files: Array<ast.FileNode> | undefined, pre?: string) {
  if (!files?.length) return

  const parsers = new Map<`.${string}`, any>()
  parsers.set('.ts', parserTs)

  const fileProcessor = new FileProcessor({ storage: memoryStorage(), parsers })

  const processed = new Map<string, string>()

  for (const file of files) {
    if (!file?.path) {
      continue
    }

    if (processed.has(file.path)) {
      continue
    }

    const parsed = fileProcessor.parse(file as any)
    const code = file.baseName.endsWith('.json') ? parsed : await format(parsed)

    processed.set(file.path, code)

    const snapshotPath = path.join('__snapshots__', ...(pre ? [camelCase(pre)] : []), file.baseName)
    await expect(code).toMatchFileSnapshot(snapshotPath)
  }

  return processed
}
