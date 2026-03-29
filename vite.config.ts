import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { appendFileSync, mkdirSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPORT_PATH = resolve(__dirname, 'public/assets/report/report-pvp-result.txt')

// Vite virtual module: scan public/assets/bgm/PersonalBGM/ và inject manifest
const VIRTUAL_MODULE_ID = 'virtual:personal-bgm-manifest'
const RESOLVED_ID = '\0' + VIRTUAL_MODULE_ID

function personalBgmManifestPlugin() {
  return {
    name: 'personal-bgm-manifest',
    resolveId(id: string) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_ID
    },
    load(id: string) {
      if (id !== RESOLVED_ID) return
      const folder = resolve(__dirname, 'public/assets/bgm/PersonalBGM')
      let files: string[] = []
      try {
        files = readdirSync(folder).filter(f => /^no\d+\.(mp3|ogg)$/i.test(f))
      } catch { /* folder không tồn tại */ }

      // Build manifest: { [playerNo]: string[] }
      const manifest: Record<number, string[]> = {}
      for (const file of files) {
        const match = file.match(/^no(\d+)\.(mp3|ogg)$/i)
        if (!match) continue
        const no = parseInt(match[1], 10)
        if (no < 1 || no > 260) continue
        if (!manifest[no]) manifest[no] = []
        manifest[no].push(file)
      }
      return `export const PERSONAL_BGM_MANIFEST = ${JSON.stringify(manifest)};`
    },
  }
}

// Vite plugin: expose POST /api/append-report endpoint in dev server
function reportAppendPlugin() {
  return {
    name: 'report-append',
    configureServer(server: any) {
      server.middlewares.use('/api/append-report', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        let body = ''
        req.on('data', (chunk: any) => { body += chunk })
        req.on('end', () => {
          try {
            const { content } = JSON.parse(body)
            mkdirSync(dirname(REPORT_PATH), { recursive: true })
            appendFileSync(REPORT_PATH, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, error: e.message }))
          }
        })
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), reportAppendPlugin(), personalBgmManifestPlugin()],
  // Base path cho GitHub Pages - thay đổi nếu repo name khác
  base: process.env.GITHUB_ACTIONS ? '/WOMRE/' : '/',
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-dnd': ['@hello-pangea/dnd'],
          'vendor-tauri': [
            '@tauri-apps/api',
            '@tauri-apps/plugin-dialog',
            '@tauri-apps/plugin-fs',
            '@tauri-apps/plugin-shell',
          ],
        },
      },
    },
  },
})
