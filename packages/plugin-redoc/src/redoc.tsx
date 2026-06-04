import fs from 'node:fs'
import path from 'node:path'
import type { AdapterOas } from '@kubb/adapter-oas'
import pkg from 'handlebars'

type BuildDocsOptions = {
  title?: string
  disableGoogleFont?: boolean
  templateOptions?: any
}

/**
 * Renders a self-contained Redoc HTML page for an OpenAPI document. The page
 * embeds the spec inline and pulls Redoc's bundle from a CDN at runtime, so
 * the generated file works without further build steps.
 */
export async function getPageHTML(api: AdapterOas['document'], { title, disableGoogleFont, templateOptions }: BuildDocsOptions = {}) {
  const templateFileName = path.join(import.meta.dirname, '../static/redoc.hbs')
  const template = pkg.compile(fs.readFileSync(templateFileName).toString())
  return template({
    title: title || api.info.title || 'ReDoc documentation',
    redocHTML: `
     <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
 <div id="redoc-container"></div>
 <script>
   const data = ${JSON.stringify(api, null, 2)};
   Redoc.init(data, {
     "expandResponses": "200,400"
   }, document.getElementById('redoc-container'))
 </script>
    `,
    disableGoogleFont,
    templateOptions,
  })
}
