import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { UserConfig } from '@kubb/core'
import { findConfigFile, loadConfigFile } from 'unplugin-kubb'

/**
 * A Kubb config found for a TypeScript project, with what TypeScript needs to reload it.
 */
export type ProjectConfig = {
  /**
   * Path of the config file, or of the `kubb.config.ts` TypeScript watches for when none exists.
   */
  file: string
  /**
   * The configs the file exports, empty when there is no config file.
   */
  configs: Array<UserConfig>
  /**
   * Changes when the config file changes, so TypeScript transforms its specs again.
   */
  identity: string
  /**
   * Why the config file failed to load. Each transform reports it on the spec.
   */
  error?: string
}

/**
 * Finds the Kubb config the way the Kubb CLI does, from `dir` up, and loads it. A config that
 * exports a function is called with no CLI options.
 */
export async function loadProjectConfig(dir: string): Promise<ProjectConfig> {
  const file = findConfigFile(dir)
  if (!file) return { file: join(resolve(dir), 'kubb.config.ts'), configs: [], identity: 'none' }

  const identity = createHash('sha256').update(readFileSync(file)).digest('hex')
  try {
    return { file, configs: await loadConfigFile<UserConfig>(file, {}), identity }
  } catch (error) {
    return { file, configs: [], identity, error: `${file} failed to load: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * The config whose `input` is `fileName`, else the first one. `input` and `root` resolve from
 * the config file's folder, as the Kubb CLI resolves them.
 */
export function selectConfig({ file, configs }: Pick<ProjectConfig, 'file' | 'configs'>, fileName: string): UserConfig | undefined {
  const matches = (config: UserConfig) => typeof config.input === 'string' && resolve(dirname(file), config.root ?? '.', config.input) === resolve(fileName)

  return configs.find(matches) ?? configs[0]
}
