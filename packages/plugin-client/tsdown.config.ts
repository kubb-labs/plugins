import { definePluginConfig } from '../../configs/tsdown.config.ts'

export default definePluginConfig({
  templates: [
    'client',
    'core',
    'mediaTypes',
    'mediaTypes/formData',
    'mediaTypes/urlencoded',
    'serializers',
    'serializers/cookies',
    'serializers/headers',
    'serializers/path',
    'serializers/pathStyles',
    'serializers/query',
    'serializers/queryStyles',
    'sse',
    'standardSchema',
  ],
})
