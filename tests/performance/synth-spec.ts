/**
 * Generates a synthetic OpenAPI document at `tests/performance/.cache/synth.json`.
 * Used by `perf:medium` for an OOM-free before/after comparison of streaming
 * AST cache behavior.
 *
 * Defaults: 400 schemas, 600 operations. Override with `SYNTH_SCHEMAS` /
 * `SYNTH_OPERATIONS` env vars.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCHEMA_COUNT = Number(process.env['SYNTH_SCHEMAS'] ?? 400)
const OPERATION_COUNT = Number(process.env['SYNTH_OPERATIONS'] ?? 600)
const out = path.resolve(__dirname, '.cache', 'synth.json')

const schemas: Record<string, unknown> = {}
for (let i = 0; i < SCHEMA_COUNT; i++) {
  const refIndex = (i + 1) % SCHEMA_COUNT
  schemas[`Entity${i}`] = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: { type: 'integer', format: 'int64' },
      name: { type: 'string' },
      description: { type: 'string', maxLength: 200 },
      tags: { type: 'array', items: { type: 'string' } },
      child: { $ref: `#/components/schemas/Entity${refIndex}` },
      metadata: {
        type: 'object',
        properties: {
          created: { type: 'string', format: 'date-time' },
          updated: { type: 'string', format: 'date-time' },
          version: { type: 'integer' },
        },
      },
    },
  }
}

const paths: Record<string, unknown> = {}
for (let i = 0; i < OPERATION_COUNT; i++) {
  const schemaIndex = i % SCHEMA_COUNT
  paths[`/entities/${i}`] = {
    get: {
      operationId: `getEntity${i}`,
      tags: [`group${i % 20}`],
      parameters: [
        { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
        { name: 'offset', in: 'query', required: false, schema: { type: 'integer' } },
      ],
      responses: {
        '200': {
          description: 'ok',
          content: { 'application/json': { schema: { $ref: `#/components/schemas/Entity${schemaIndex}` } } },
        },
      },
    },
    post: {
      operationId: `createEntity${i}`,
      tags: [`group${i % 20}`],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: `#/components/schemas/Entity${schemaIndex}` } } },
      },
      responses: {
        '201': {
          description: 'created',
          content: { 'application/json': { schema: { $ref: `#/components/schemas/Entity${schemaIndex}` } } },
        },
      },
    },
  }
}

const doc = {
  openapi: '3.0.3',
  info: { title: 'Synthetic API', version: '1.0.0' },
  paths,
  components: { schemas },
}

fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify(doc))
const stat = fs.statSync(out)
console.log(`Wrote ${out} (${(stat.size / 1024).toFixed(0)} KiB, ${SCHEMA_COUNT} schemas, ${OPERATION_COUNT * 2} operations)`)
