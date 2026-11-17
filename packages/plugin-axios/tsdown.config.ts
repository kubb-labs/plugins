import { definePluginConfig } from '../../configs/tsdown.config.ts'
import { sharedTemplates } from '../../configs/sharedTemplates.ts'

export default definePluginConfig({ templates: ['client'], templatePlugins: [sharedTemplates] })
