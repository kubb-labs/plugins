/**
 * JavaScript and Java reserved words.
 * @link https://github.com/jonschlinkert/reserved/blob/master/index.js
 */
const reservedWords = new Set([
  'abstract',
  'arguments',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'double',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'final',
  'finally',
  'float',
  'for',
  'function',
  'goto',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'int',
  'interface',
  'let',
  'long',
  'native',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'volatile',
  'while',
  'with',
  'yield',
  'Array',
  'Date',
  'hasOwnProperty',
  'Infinity',
  'isFinite',
  'isNaN',
  'isPrototypeOf',
  'length',
  'Math',
  'name',
  'NaN',
  'Number',
  'Object',
  'prototype',
  'String',
  'toString',
  'undefined',
  'valueOf',
] as const)

/**
 * Returns `true` when `name` is a syntactically valid JavaScript variable name.
 *
 * @example
 * ```ts
 * isValidVarName('status')  // true
 * isValidVarName('class')   // false (reserved word)
 * isValidVarName('42foo')   // false (starts with digit)
 * ```
 */
export function isValidVarName(name: string): boolean {
  if (!name || reservedWords.has(name as 'valueOf')) {
    return false
  }
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)
}
