import type { AdapterOas } from '@kubb/adapter-oas'

type BuildDocsOptions = {
  title?: string
  disableGoogleFont?: boolean
  templateOptions?: any
}

const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"'`=]/g, (char) => htmlEscapes[char] ?? char)
}

/**
 * Renders a self-contained Redoc HTML page for an OpenAPI document. The page
 * embeds the spec inline and pulls Redoc's bundle from a CDN at runtime, so
 * the generated file works without further build steps.
 */
export async function getPageHTML(api: AdapterOas['document'], { title, disableGoogleFont }: BuildDocsOptions = {}) {
  const pageTitle = escapeHtml(title || api.info.title || 'ReDoc documentation')
  const googleFont = disableGoogleFont
    ? ''
    : `<link href='https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700' rel='stylesheet' />`
  const redocHTML = `
     <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
 <div id="redoc-container"></div>
 <script>
   const data = ${JSON.stringify(api, null, 2)};
   Redoc.init(data, {
     "expandResponses": "200,400"
   }, document.getElementById('redoc-container'))
 </script>
    `

  return `<html>

  <head>
    <meta charset='utf8' />
    <title>${pageTitle}</title>
    <!-- needed for adaptive design -->
    <meta name='viewport' content='width=device-width, initial-scale=1' />
    <style>
      body {
        padding: 0;
        margin: 0;
      }
    </style>
    ${googleFont}
  </head>

  <body>
    ${redocHTML}
  </body>

</html>`
}
