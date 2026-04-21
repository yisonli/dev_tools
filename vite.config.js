import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/** 生产包用 IIFE + 去掉 type="module"，便于 dist 内 index.html 用 file:// 双击打开 */
function fileProtocolBuildHtml() {
  return {
    name: 'file-protocol-build-html',
    apply: 'build',
    transformIndexHtml(html) {
      return html
        .replace('<script type="module" crossorigin ', '<script ')
        .replace('<script type="module" ', '<script ')
        .replace('<script src=', '<script defer src=')
    },
  }
}

/** GitHub Pages 项目页 base；勿在 Windows Git Bash 里写 `--base /仓库名/`（会被 MSYS 改写路径） */
function resolveBase(mode, command) {
  if (command !== 'build') return '/'
  if (mode === 'github-pages') {
    const repo = process.env.GITHUB_REPOSITORY_NAME?.trim()
    if (repo && /^[a-zA-Z0-9_.-]+$/.test(repo)) return `/${repo}/`
    return '/dev_tools/'
  }
  return './'
}

export default defineConfig(({ mode, command }) => ({
  plugins: [vue(), fileProtocolBuildHtml()],
  base: resolveBase(mode, command),
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        name: 'DevToolsApp',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
}))
