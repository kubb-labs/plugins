import type { Exclude, Include, Output, Override, PluginFactoryOptions } from 'kubb/kit'

export type Options = {
  /**
   * Output location of the generated Redoc HTML file. The path is resolved
   * against the global `output.path` set on `defineConfig`.
   */
  output?: {
    /**
     * File path of the generated HTML, relative to the global `output.path`.
     * Unlike most plugins, this points at a single file rather than a directory.
     *
     * @default 'docs.html'
     */
    path: string
  }
}

export type ResolveOptions = {
  output: Output<never>
  name: string
  exclude: Array<Exclude>
  include?: Array<Include>
  override: Array<Override<ResolveOptions>>
}

export type PluginRedoc = PluginFactoryOptions<'plugin-redoc', Options, ResolveOptions>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-redoc': PluginRedoc
    }
  }
}
