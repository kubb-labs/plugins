import { readFileSync, writeFileSync } from 'node:fs'
import { normalize } from './expectations.mjs'

const cell = process.argv[2] || 'pluginTs__output_path__default'
const file = process.argv[3] || 'types/Pet.ts'

const v4 = readFileSync(`/tmp/matrix-out/v4/${cell}/${file}`, 'utf-8')
const v5 = readFileSync(`/tmp/matrix-out/v5/${cell}/${file}`, 'utf-8')

const n4 = normalize(v4)
const n5 = normalize(v5)

writeFileSync('/tmp/n4.txt', n4.result)
writeFileSync('/tmp/n5.txt', n5.result)

console.log('v4 rules applied:', n4.rules.join(', '))
console.log('v5 rules applied:', n5.rules.join(', '))
console.log('identical after normalise:', n4.result === n5.result)
