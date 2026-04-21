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
        // 普通 script 在 head 里默认会阻塞并早于 body 执行，#app 还不存在；module 脚本等价于 defer
        .replace('<script src=', '<script defer src=')
    },
  }
}

export default defineConfig({
  plugins: [vue(), fileProtocolBuildHtml()],
  base: process.env.NODE_ENV === 'production' ? '/dev_tools/' : '/',
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
})
