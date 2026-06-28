import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['typescript', 'react'],
  ignorePatterns: [
    '**/node_modules/**',
    '**/__snapshots__/**',
    '**/schemas/**',
    '**/coverage/**',
    '**/assets/**',
    '**/public/**',
    '**/dist/**',
    '**/artifacts/**',
    '**/.next/**',
    '**/.output/**',
    '**/.nitro/**',
    '**/src/gen/**',
    '**/CHANGELOG.md',
  ],
  rules: {
    'no-shadow-restricted-names': 'off',
    'no-empty-pattern': 'off',
    'no-unsafe-optional-chaining': 'off',
    'no-unused-private-class-members': 'off',
    'no-constructor-return': 'off',
    'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    'typescript/no-this-alias': 'off',
    'no-else-return': 'error',
    'default-param-last': 'error',
    'prefer-exponentiation-operator': 'error',
    'typescript/array-type': ['error', { default: 'generic' }],
    'typescript/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
    'typescript/no-explicit-any': 'error',
    'typescript/no-inferrable-types': 'error',
    'typescript/prefer-function-type': 'error',
    'react/self-closing-comp': 'error',
    'react/no-array-index-key': 'warn',
  },
  overrides: [
    {
      files: ['**/gen/**'],
      rules: {
        'typescript/array-type': 'off',
        'no-unused-vars': 'off',
      },
    },
    {
      // Generated output mirrors the OpenAPI document, so a schema typed `any` stays `any`.
      files: ['examples/**'],
      rules: {
        'typescript/no-explicit-any': 'off',
      },
    },
  ],
})
