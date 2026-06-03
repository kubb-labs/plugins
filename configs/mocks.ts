import type { ast } from '@kubb/core'
import { createMockedPluginDriver, matchFiles as matchFilesBase } from '@kubb/core/mocks'
import { parserTs } from '@kubb/parser-ts'
import type { Options } from 'prettier'
import { format as prettierFormat } from 'prettier'
import pluginTypescript from 'prettier/plugins/typescript'

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

const parsers = new Map<`.${string}`, any>([['.ts', parserTs]])

export function matchFiles(files: Array<ast.FileNode> | undefined, pre?: string) {
  return matchFilesBase(files, { parsers, format, pre })
}
