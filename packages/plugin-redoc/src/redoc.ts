import type { AdapterOas } from '@kubb/adapter-oas'

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

const scriptEscapes: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}

/**
 * Serializes `value` as JSON that is safe to inline in a `<script>` tag.
 * JSON only allows these characters inside strings, where the `\uXXXX` escapes
 * parse back to the same value, so a spec string such as `</script>` can no
 * longer close the tag early.
 */
function toScriptJSON(value: unknown) {
  return JSON.stringify(value, null, 2).replace(/[<>&\u2028\u2029]/g, (char) => scriptEscapes[char] ?? char)
}

/**
 * Redoc bundle the page loads, pinned to one release with a Subresource
 * Integrity hash so a changed or compromised CDN file does not run. When
 * bumping the version, recompute the hash from the npm tarball:
 * `openssl dgst -sha384 -binary package/bundles/redoc.standalone.js | openssl base64 -A`.
 */
const redocBundle = {
  src: 'https://cdn.jsdelivr.net/npm/redoc@2.5.4/bundles/redoc.standalone.js',
  integrity: 'sha384-w447zOpYfw/1Tv/5AK9NfHTlQIqE3RVR6KY62jCyy9zNDgO64cMwGGP1Fj0zJVf5',
}

/**
 * Renders a self-contained Redoc HTML page for an OpenAPI document. The page
 * embeds the spec inline and pulls Redoc's bundle from a CDN at runtime, so
 * the generated file works without further build steps.
 */
export function getPageHTML(api: AdapterOas['document']) {
  const pageTitle = escapeHtml(api.info.title || 'ReDoc documentation')
  const googleFont = `<link href='https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700' rel='stylesheet' />`
  const redocHTML = `
     <script src="${redocBundle.src}" integrity="${redocBundle.integrity}" crossorigin="anonymous"></script>
 <div id="redoc-container"></div>
 <script>
   const data = ${toScriptJSON(api)};
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
