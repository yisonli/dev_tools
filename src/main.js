import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// 导入各个工具组件
import Base64Tool from './components/tools/Base64Tool.vue'
import AesTool from './components/tools/AesTool.vue'
import RsaTool from './components/tools/RsaTool.vue'
import Sm2Tool from './components/tools/Sm2Tool.vue'
import UrlTool from './components/tools/UrlTool.vue'
import DesTool from './components/tools/DesTool.vue'
import QrcodeTool from './components/tools/QrcodeTool.vue'
import BarcodeTool from './components/tools/BarcodeTool.vue'
import UnicodeTool from './components/tools/UnicodeTool.vue'
import JsonTool from './components/tools/JsonTool.vue'
import YamlTool from './components/tools/YamlTool.vue'
import TimestampTool from './components/tools/TimestampTool.vue'
import RegexTool from './components/tools/RegexTool.vue'
import PasswordTool from './components/tools/PasswordTool.vue'

const routes = [
  { path: '/', redirect: '/base64' },
  { path: '/base64', component: Base64Tool, meta: { title: 'BASE64编码' } },
  { path: '/aes', component: AesTool, meta: { title: 'AES加密' } },
  { path: '/rsa', component: RsaTool, meta: { title: 'RSA加密' } },
  { path: '/sm2', component: Sm2Tool, meta: { title: 'SM2加密' } },
  { path: '/des', component: DesTool, meta: { title: 'DES加密' } },
  { path: '/url', component: UrlTool, meta: { title: 'URL编码' } },
  { path: '/unicode', component: UnicodeTool, meta: { title: 'Unicode转换' } },
  { path: '/qrcode', component: QrcodeTool, meta: { title: '二维码工具' } },
  { path: '/barcode', component: BarcodeTool, meta: { title: '条形码工具' } },
  { path: '/json', component: JsonTool, meta: { title: 'JSON校验' } },
  { path: '/yaml', component: YamlTool, meta: { title: 'YAML校验' } },
  { path: '/timestamp', component: TimestampTool, meta: { title: '时间戳转换' } },
  { path: '/regex', component: RegexTool, meta: { title: '正则表达式' } },
  { path: '/password', component: PasswordTool, meta: { title: '密码生成器' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
