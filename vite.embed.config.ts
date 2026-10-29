import { mergeConfig } from 'vite'
import base from './vite.config'

// The hero demo on the NavCRM landing page: embed.html built with relative paths into the
// landing site, which serves it at landing/app/embed.html.
export default mergeConfig(base, {
  base: './',
  publicDir: false,
  build: {
    outDir: '../landing/app',
    emptyOutDir: true,
    rollupOptions: { input: 'embed.html' },
  },
})
