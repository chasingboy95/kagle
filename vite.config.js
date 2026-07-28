import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 构建期生成 PWA 预缓存清单：扫描本次产物中的哈希资源（JS/CSS/SVG），
// 写入 precache-manifest.json 供验证，并把资源列表与版本化缓存名注入
// public/sw.js，使 Service Worker 在首次安装即预缓存全部构建资源，支持离线启动。
function precacheManifest() {
  // 资源清单与版本化缓存名在 generateBundle 计算，sw.js 占位符替换推迟到
  // closeBundle：public/ 下的文件由 Vite 原样拷贝到 dist/，不进入 Rollup bundle，
  // 因此只能在拷贝完成后对 dist/sw.js 重写。
  let cacheName = ''
  let precacheAssets = []
  return {
    name: 'kagle-precache-manifest',
    generateBundle(_options, bundle) {
      const assetFiles = Object.keys(bundle).filter((file) =>
        /^assets\/[^/]+\.(js|css|svg)$/.test(file),
      )
      precacheAssets = assetFiles
        .map((file) => `/kagle/${file}`)
        .sort()

      // 资源哈希变化时缓存名随之变化，旧缓存在 activate 阶段被删除。
      const revision = createHash('md5')
        .update(precacheAssets.join(','))
        .digest('hex')
        .slice(0, 8)
      cacheName = `kagle-pwa-v4-${revision}`

      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.json',
        source: JSON.stringify(
          { cacheName, generatedAt: 'build-time', assets: precacheAssets },
          null,
          2,
        ),
      })
    },
    closeBundle() {
      const swPath = path.join(__dirname, 'dist', 'sw.js')
      if (!existsSync(swPath)) return
      const source = readFileSync(swPath, 'utf8')
        .replace('__CACHE_NAME__', `'${cacheName}'`)
        .replace('__PRECACHE_ASSETS__', JSON.stringify(precacheAssets))
      writeFileSync(swPath, source)
    },
  }
}

export default defineConfig({
  base: '/kagle/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [tailwindcss(), react(), precacheManifest()],
})
