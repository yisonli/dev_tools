import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

const routes = [
  { path: '/', component: () => import('./components/ToolHome.vue'), meta: { title: '开发者工具箱' } },
  { path: '/base64', component: () => import('./components/tools/Base64Tool.vue'), meta: { title: 'BASE64编码' } },
  { path: '/aes', component: () => import('./components/tools/AesTool.vue'), meta: { title: 'AES加密' } },
  { path: '/rsa', component: () => import('./components/tools/RsaTool.vue'), meta: { title: 'RSA加密' } },
  { path: '/sm2', component: () => import('./components/tools/Sm2Tool.vue'), meta: { title: 'SM2加密' } },
  { path: '/des', component: () => import('./components/tools/DesTool.vue'), meta: { title: 'DES加密' } },
  { path: '/url', component: () => import('./components/tools/UrlTool.vue'), meta: { title: 'URL编码' } },
  { path: '/unicode', component: () => import('./components/tools/UnicodeTool.vue'), meta: { title: 'Unicode转换' } },
  { path: '/qrcode', component: () => import('./components/tools/QrcodeTool.vue'), meta: { title: '二维码工具' } },
  { path: '/barcode', component: () => import('./components/tools/BarcodeTool.vue'), meta: { title: '条形码工具' } },
  { path: '/json', component: () => import('./components/tools/JsonTool.vue'), meta: { title: 'JSON校验' } },
  { path: '/yaml', component: () => import('./components/tools/YamlTool.vue'), meta: { title: 'YAML校验' } },
  { path: '/timestamp', component: () => import('./components/tools/TimestampTool.vue'), meta: { title: '时间戳转换' } },
  { path: '/regex', component: () => import('./components/tools/RegexTool.vue'), meta: { title: '正则表达式' } },
  { path: '/password', component: () => import('./components/tools/PasswordTool.vue'), meta: { title: '密码生成器' } },
  { path: '/hash', component: () => import('./components/tools/HashTool.vue'), meta: { title: '哈希摘要' } },
  { path: '/jwt', component: () => import('./components/tools/JwtTool.vue'), meta: { title: 'JWT 解析' } },
  { path: '/uuid', component: () => import('./components/tools/UuidTool.vue'), meta: { title: 'UUID 生成器' } },
  { path: '/text', component: () => import('./components/tools/TextTool.vue'), meta: { title: '文本处理' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
