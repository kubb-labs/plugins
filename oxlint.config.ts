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
    'typescript/no-inferrable-types': 'error',
    'typescript/prefer-function-type': 'error',
    'react/self-closing-comp': 'error',
    'react/no-array-index-key': 'warn',
  },
  overrides: [
    {
      // Generated code (kubb output) legitimately uses `T[]` array syntax and imports
      // response types it does not always reference, so relax the purely-stylistic rules
      // there. `ignorePatterns` cannot be used: oxlint then reports "No files found" and
      // exits non-zero for the explicit file paths kubb passes.
      files: ['**/gen/**'],
      rules: {
        'typescript/array-type': 'off',
        'no-unused-vars': 'off',
      },
    },
  ],
})
