import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Custom plugin to copy manifest.json and handle extension files
const extensionPlugin = () => {
  return {
    name: 'extension-plugin',
    apply: 'build',
    writeBundle(options: any) {
      const outDir = options.dir || 'dist'

      // Copy manifest.json from extension directory to dist
      const manifestSrc = path.resolve(__dirname, '../extension/manifest.json')
      const manifestDest = path.resolve(outDir, 'manifest.json')
      if (fs.existsSync(manifestSrc)) {
        fs.copyFileSync(manifestSrc, manifestDest)
        console.log('  ✓ Copied manifest.json')
      }

      // Copy icons directory if it exists
      const iconsSrc = path.resolve(__dirname, '../extension/icons')
      const iconsDest = path.resolve(outDir, 'icons')
      if (fs.existsSync(iconsSrc)) {
        // Create icons directory if it doesn't exist
        if (!fs.existsSync(iconsDest)) {
          fs.mkdirSync(iconsDest, { recursive: true })
        }
        // Copy all icon files
        const icons = fs.readdirSync(iconsSrc)
        icons.forEach((icon) => {
          const src = path.join(iconsSrc, icon)
          const dest = path.join(iconsDest, icon)
          if (fs.statSync(src).isFile()) {
            fs.copyFileSync(src, dest)
          }
        })
        console.log(`  ✓ Copied icons/ directory`)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), extensionPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        // React entry points
        main: path.resolve(__dirname, 'index.html'),
        sidepanel: path.resolve(__dirname, 'sidepanel.html'),
        // Extension scripts
        background: path.resolve(__dirname, '../extension/background/index.ts'),
        content: path.resolve(__dirname, '../extension/content/index.ts'),
      },
      output: {
        // Ensure extension scripts are output in the correct directories
        entryFileNames: (chunkInfo: any) => {
          if (chunkInfo.name === 'background') {
            return 'background/index.js'
          }
          if (chunkInfo.name === 'content') {
            return 'content/index.js'
          }
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
