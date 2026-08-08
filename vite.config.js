import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/** GitHub Pages 项目页 base；独立域名使用相对资源路径。 */
function resolveBase(mode) {
  if (mode === 'github-pages') {
    const repo = process.env.GITHUB_REPOSITORY_NAME?.trim()
    if (repo && /^[a-zA-Z0-9_.-]+$/.test(repo)) return `/${repo}/`
    return '/dev_tools/'
  }
  return './'
}

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  base: resolveBase(mode),
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    open: true,
  },
}))
