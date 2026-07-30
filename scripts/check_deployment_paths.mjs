import { readFile } from 'node:fs/promises'

const expectedBase = process.argv[2]

if (!expectedBase || !expectedBase.startsWith('/') || !expectedBase.endsWith('/')) {
  throw new Error('Expected a normalized base path such as / or /kagle/')
}

const readText = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), 'utf8')
const [html, manifestSource, serviceWorker, precacheSource] = await Promise.all([
  readText('index.html'),
  readText('manifest.webmanifest'),
  readText('sw.js'),
  readText('precache-manifest.json'),
])

const manifest = JSON.parse(manifestSource)
const precache = JSON.parse(precacheSource)
const expectedAssetBase = `${expectedBase}assets/`

if (manifest.start_url !== expectedBase || manifest.scope !== expectedBase) {
  throw new Error(`Manifest does not use deployment base ${expectedBase}`)
}

for (const icon of manifest.icons) {
  if (!icon.src.startsWith(expectedBase)) {
    throw new Error(`Manifest icon has the wrong base: ${icon.src}`)
  }
}

for (const asset of precache.assets) {
  if (!asset.startsWith(expectedAssetBase)) {
    throw new Error(`Precache asset has the wrong base: ${asset}`)
  }
}

const expectedPublicPaths = [
  `${expectedBase}favicon.svg`,
  `${expectedBase}apple-touch-icon-20260730.png`,
  `${expectedBase}manifest.webmanifest`,
]

for (const publicPath of expectedPublicPaths) {
  if (!html.includes(publicPath)) {
    throw new Error(`index.html is missing ${publicPath}`)
  }
}

if (!serviceWorker.includes(`const BASE_PATH = '${expectedBase}'`)) {
  throw new Error(`Service Worker does not use deployment base ${expectedBase}`)
}

if (expectedBase === '/') {
  for (const [name, source] of [
    ['index.html', html],
    ['manifest.webmanifest', manifestSource],
    ['sw.js', serviceWorker],
    ['precache-manifest.json', precacheSource],
  ]) {
    if (source.includes('/kagle/')) {
      throw new Error(`${name} still contains the GitHub Pages base path`)
    }
  }
}

console.log(`Verified deployment paths for ${expectedBase}`)
