<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">二维码生成/解析</h2>
        <p class="text-gray-600">
          生成各种内容的二维码，支持文本、URL、WiFi、联系人等，也可以解析二维码图片内容。
        </p>
      </div>

      <div class="grid gap-6" :class="qrMode === 'standard' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'">
        <!-- 二维码生成 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">二维码生成</h3>

          <div class="mode-switch" role="group" aria-label="二维码外观">
            <button type="button" :aria-pressed="qrMode === 'standard'" @click="setQrMode('standard')">标准</button>
            <button type="button" :aria-pressed="qrMode === 'photo'" @click="setQrMode('photo')">图片融合</button>
          </div>

          <!-- 内容类型选择 -->
          <div>
            <label for="qr-content-type" class="block text-sm font-medium text-gray-700 mb-2">
              内容类型
            </label>
            <select id="qr-content-type" v-model="contentType" @change="onContentTypeChange" class="input-field">
              <option value="text">普通文本</option>
              <option value="url">网址链接</option>
              <option value="wifi">WiFi信息</option>
              <option value="contact">联系人信息</option>
              <option value="sms">短信</option>
              <option value="email">邮件</option>
              <option value="image">本地二维码图片</option>
            </select>
          </div>

          <!-- 动态内容输入 -->
          <div v-if="contentType === 'text'">
            <label for="qr-text" class="block text-sm font-medium text-gray-700 mb-2">
              文本内容
            </label>
            <textarea
              id="qr-text"
              v-model="textContent"
              placeholder="请输入要生成二维码的文本..."
              class="textarea-field h-20"
              @input="generateQRCode"
            ></textarea>
          </div>

          <div v-else-if="contentType === 'url'">
            <label for="qr-url" class="block text-sm font-medium text-gray-700 mb-2">
              网址URL
            </label>
            <input
              id="qr-url"
              v-model="urlContent"
              type="url"
              placeholder="https://example.com"
              class="input-field"
              @input="generateQRCode"
            />
          </div>

          <div v-else-if="contentType === 'wifi'" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="qr-wifi-ssid" class="block text-sm font-medium text-gray-700 mb-1">
                  WiFi名称(SSID)
                </label>
                <input
                  id="qr-wifi-ssid"
                  v-model="wifiData.ssid"
                  placeholder="WiFi名称"
                  class="input-field"
                  @input="generateQRCode"
                />
              </div>
              <div>
                <label for="qr-wifi-security" class="block text-sm font-medium text-gray-700 mb-1">
                  加密类型
                </label>
                <select id="qr-wifi-security" v-model="wifiData.security" @change="generateQRCode" class="input-field">
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">无密码</option>
                </select>
              </div>
            </div>
            <div>
              <label for="qr-wifi-password" class="block text-sm font-medium text-gray-700 mb-1">
                WiFi密码
              </label>
              <input
                id="qr-wifi-password"
                v-model="wifiData.password"
                :disabled="wifiData.security === 'nopass'"
                placeholder="WiFi密码"
                class="input-field"
                @input="generateQRCode"
              />
            </div>
          </div>

          <div v-else-if="contentType === 'contact'" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <input
                v-model="contactData.name"
                aria-label="联系人姓名"
                placeholder="姓名"
                class="input-field"
                @input="generateQRCode"
              />
              <input
                v-model="contactData.phone"
                aria-label="联系人电话"
                placeholder="电话号码"
                class="input-field"
                @input="generateQRCode"
              />
            </div>
            <input
              v-model="contactData.email"
              aria-label="联系人邮箱"
              placeholder="邮箱地址"
              class="input-field"
              @input="generateQRCode"
            />
            <input
              v-model="contactData.organization"
              aria-label="联系人组织"
              placeholder="公司/组织"
              class="input-field"
              @input="generateQRCode"
            />
          </div>

          <div v-else-if="contentType === 'sms'" class="space-y-3">
            <div><label for="qr-sms-phone" class="field-label">手机号码</label><input id="qr-sms-phone" v-model="contactData.phone" class="input-field" type="tel" placeholder="接收短信的号码" @input="generateQRCode" /></div>
            <div><label for="qr-sms-body" class="field-label">短信内容</label><textarea id="qr-sms-body" v-model="textContent" class="textarea-field h-24" placeholder="短信内容" @input="generateQRCode" /></div>
          </div>

          <div v-else-if="contentType === 'email'" class="space-y-3">
            <div><label for="qr-email-address" class="field-label">邮箱地址</label><input id="qr-email-address" v-model="contactData.email" class="input-field" type="email" placeholder="name@example.com" @input="generateQRCode" /></div>
            <div><label for="qr-email-subject" class="field-label">邮件主题</label><input id="qr-email-subject" v-model="textContent" class="input-field" placeholder="邮件主题" @input="generateQRCode" /></div>
          </div>

          <div v-else-if="contentType === 'image'" class="space-y-3">
            <input ref="sourceQrInput" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="上传本地二维码图片" @change="handleSourceQrUpload" />
            <button type="button" class="btn btn-secondary inline-flex items-center gap-2" :disabled="qrImageLoading" @click="$refs.sourceQrInput.click()"><ImagePlus :size="17" />{{ qrImageLoading ? '识别中…' : qrImageName ? '更换二维码图片' : '选择二维码图片' }}</button>
            <div v-if="qrImagePreview" class="flex items-center gap-3 min-w-0">
              <img :src="qrImagePreview" alt="上传的二维码图片" class="w-20 h-20 object-contain border rounded" />
              <span class="min-w-0 break-all text-sm text-gray-600">{{ qrImageName }}</span>
            </div>
            <p v-if="qrImageError" class="text-red-600 text-sm" role="alert">{{ qrImageError }}</p>
            <div v-if="qrImageContent">
              <label for="qr-image-content" class="field-label">识别内容</label>
              <textarea id="qr-image-content" :value="qrImageContent" readonly class="textarea-field h-20 bg-gray-50"></textarea>
            </div>
          </div>

          <!-- 二维码设置 -->
          <div v-show="qrMode === 'standard'" class="p-3 bg-gray-50 rounded-lg">
            <h4 class="font-medium text-gray-700 mb-3">二维码设置</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="qr-size" class="block text-sm text-gray-600 mb-1">尺寸</label>
                <select id="qr-size" v-model="qrOptions.width" @change="generateQRCode" class="input-field text-sm">
                  <option :value="200">200x200</option>
                  <option :value="300">300x300</option>
                  <option :value="400">400x400</option>
                  <option :value="500">500x500</option>
                </select>
              </div>
              <div>
                <label for="qr-error-level" class="block text-sm text-gray-600 mb-1">纠错级别</label>
                <select id="qr-error-level" v-model="qrOptions.errorCorrectionLevel" @change="generateQRCode" class="input-field text-sm">
                  <option value="L">低 (7%)</option>
                  <option value="M">中 (15%)</option>
                  <option value="Q">较高 (25%)</option>
                  <option value="H">高 (30%)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 二维码显示 -->
          <div v-show="qrMode === 'standard'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              生成的二维码
            </label>
            <div class="border rounded-lg p-4 bg-gray-50 text-center">
              <canvas ref="qrCanvas" class="mx-auto"></canvas>
              <div v-if="!qrGenerated" class="text-gray-500 py-8">
                请输入内容生成二维码
              </div>
            </div>
          </div>

          <div v-show="qrMode === 'standard'" class="flex space-x-2">
            <button
              @click="downloadQRCode"
              class="btn btn-primary"
              :disabled="!qrGenerated"
            >
              下载二维码
            </button>
            <button
              @click="clearGenerate"
              class="btn btn-secondary"
            >
              清空
            </button>
          </div>

          <PhotoQrPanel :content="getQRContent()" :active="qrMode === 'photo'" v-show="qrMode === 'photo'" />
        </div>

        <!-- 二维码解析 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">二维码解析</h3>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              上传二维码图片
            </label>
            <div
              class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
              @click="triggerFileUpload"
              @dragover.prevent
              @drop.prevent="handleFileDrop"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleFileUpload"
                class="hidden"
              />
              <svg class="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p class="text-gray-600">点击或拖拽图片到这里</p>
              <p class="text-sm text-gray-500 mt-1">支持 JPG、PNG、GIF 格式</p>
            </div>
          </div>

          <!-- 图片预览 -->
          <div v-if="uploadedImage">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              图片预览
            </label>
            <img :src="uploadedImage" alt="上传的图片" class="max-w-full h-auto rounded-lg border">
          </div>

          <!-- 解析结果 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              解析结果
            </label>
            <textarea
              v-model="parseResult"
              readonly
              class="textarea-field h-32 bg-gray-50"
              placeholder="解析结果将显示在这里..."
            ></textarea>
          </div>

          <div v-if="parseError" class="text-red-600 text-sm">
            {{ parseError }}
          </div>

          <div class="flex space-x-2">
            <button
              @click="parseQRCode"
              class="btn btn-primary"
              :disabled="!uploadedImage || isParsing"
            >
              {{ isParsing ? '解析中...' : '解析二维码' }}
            </button>
            <button
              @click="copyParseResult"
              class="btn btn-secondary"
              :disabled="!parseResult"
            >
              复制结果
            </button>
            <button
              @click="clearParse"
              class="btn btn-secondary"
            >
              清空
            </button>
          </div>
        </div>
      </div>

      <details class="mt-8 text-sm text-gray-600">
        <summary class="cursor-pointer">格式与识别说明</summary>
        <p class="mt-2 leading-6">图片融合包含柔光点阵与影调融合两种效果，也可从本地二维码图片读取内容。柔光点阵通过校验后可下载；影调融合提供屏幕大图供手机扫描，不提供图片下载。图片只在浏览器中处理，不会上传到服务器。</p>
      </details>
    </div>
  </div>
</template>

<script>
import QRCode from 'qrcode'
import QrScanner from 'qr-scanner'
import { ImagePlus } from '@lucide/vue'
import PhotoQrPanel from './PhotoQrPanel.vue'
import { loadPhoto } from '../../utils/photoQr.js'

export default {
  name: 'QrcodeTool',
  components: { PhotoQrPanel, ImagePlus },
  data() {
    return {
      qrMode: 'standard',
      contentType: 'text',
      textContent: '',
      urlContent: '',
      wifiData: {
        ssid: '',
        password: '',
        security: 'WPA'
      },
      contactData: {
        name: '',
        phone: '',
        email: '',
        organization: ''
      },
      qrOptions: {
        width: 300,
        errorCorrectionLevel: 'M'
      },
      qrGenerated: false,
      qrImageContent: '',
      qrImageName: '',
      qrImagePreview: '',
      qrImageError: '',
      qrImageLoading: false,
      qrImageRequest: 0,

      uploadedImage: null,
      parseResult: '',
      parseError: '',
      isParsing: false
    }
  },
  methods: {
    setQrMode(mode) {
      if (this.qrMode === mode) return
      this.qrMode = mode
      if (mode === 'standard') this.$nextTick(() => this.generateQRCode())
    },
    onContentTypeChange() {
      this.qrGenerated = false
      this.clearCanvas()
      this.generateQRCode()
    },

    revokeQrImagePreview() {
      if (this.qrImagePreview) URL.revokeObjectURL(this.qrImagePreview)
      this.qrImagePreview = ''
    },

    async handleSourceQrUpload(event) {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      const request = ++this.qrImageRequest
      this.revokeQrImagePreview()
      this.qrImageContent = ''
      this.qrImageName = ''
      this.qrImageError = ''
      this.qrImageLoading = true
      this.generateQRCode()

      try {
        const image = await loadPhoto(file)
        let result
        try {
          result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
        } catch {
          throw new Error('未识别到二维码，请选择清晰、完整的二维码图片。')
        } finally {
          image.dispose()
        }
        if (request !== this.qrImageRequest) return
        if (!result.data) throw new Error('二维码内容为空，请更换图片。')
        this.qrImageContent = result.data
        this.qrImageName = file.name
        this.qrImagePreview = URL.createObjectURL(file)
        this.generateQRCode()
      } catch (error) {
        if (request === this.qrImageRequest) this.qrImageError = error.message || '读取二维码图片失败。'
      } finally {
        if (request === this.qrImageRequest) this.qrImageLoading = false
      }
    },

    generateQRCode() {
      if (this.qrMode !== 'standard') return
      const content = this.getQRContent()
      if (!content) {
        this.qrGenerated = false
        this.clearCanvas()
        return
      }

      try {
        const canvas = this.$refs.qrCanvas
        QRCode.toCanvas(canvas, content, {
          width: this.qrOptions.width,
          errorCorrectionLevel: this.qrOptions.errorCorrectionLevel,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }, (error) => {
          if (error) {
            console.error('二维码生成错误:', error)
            this.qrGenerated = false
          } else {
            this.qrGenerated = true
          }
        })
      } catch (error) {
        console.error('二维码生成错误:', error)
        this.qrGenerated = false
      }
    },

    getQRContent() {
      switch (this.contentType) {
        case 'text':
          return this.textContent
        case 'url':
          return this.urlContent
        case 'wifi':
          if (!this.wifiData.ssid) return ''
          const security = this.wifiData.security === 'nopass' ? 'nopass' : this.wifiData.security
          const password = this.wifiData.security === 'nopass' ? '' : this.wifiData.password
          return `WIFI:T:${security};S:${this.wifiData.ssid};P:${password};;`
        case 'contact':
          if (!this.contactData.name) return ''
          return `BEGIN:VCARD\nVERSION:3.0\nFN:${this.contactData.name}\nTEL:${this.contactData.phone}\nEMAIL:${this.contactData.email}\nORG:${this.contactData.organization}\nEND:VCARD`
        case 'sms':
          return this.contactData.phone ? `sms:${this.contactData.phone}?body=${this.textContent}` : ''
        case 'email':
          return this.contactData.email ? `mailto:${this.contactData.email}?subject=${this.textContent}` : ''
        case 'image':
          return this.qrImageContent
        default:
          return ''
      }
    },

    clearCanvas() {
      const canvas = this.$refs.qrCanvas
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    },

    downloadQRCode() {
      if (!this.qrGenerated) return

      const canvas = this.$refs.qrCanvas
      const link = document.createElement('a')
      link.download = 'qrcode.png'
      link.href = canvas.toDataURL()
      link.click()
    },

    triggerFileUpload() {
      this.$refs.fileInput.click()
    },

    handleFileUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.processFile(file)
      }
    },

    handleFileDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        this.processFile(file)
      }
    },

    processFile(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.uploadedImage = e.target.result
        this.parseError = ''
        this.parseResult = ''
      }
      reader.readAsDataURL(file)
    },

    async parseQRCode() {
      if (!this.uploadedImage) return

      this.isParsing = true
      this.parseError = ''
      this.parseResult = ''

      try {
        const result = await QrScanner.scanImage(this.uploadedImage)
        this.parseResult = result
      } catch (error) {
        console.error('二维码解析错误:', error)
        this.parseError = '解析失败：未找到有效的二维码或图片质量不够清晰'
      } finally {
        this.isParsing = false
      }
    },

    async copyParseResult() {
      try {
        await navigator.clipboard.writeText(this.parseResult)
        this.showNotification('解析结果已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    },

    clearGenerate() {
      this.textContent = ''
      this.urlContent = ''
      this.wifiData = { ssid: '', password: '', security: 'WPA' }
      this.contactData = { name: '', phone: '', email: '', organization: '' }
      this.qrImageRequest++
      this.revokeQrImagePreview()
      this.qrImageContent = ''
      this.qrImageName = ''
      this.qrImageError = ''
      this.qrImageLoading = false
      this.qrGenerated = false
      this.clearCanvas()
    },

    clearParse() {
      this.uploadedImage = null
      this.parseResult = ''
      this.parseError = ''
      this.$refs.fileInput.value = ''
    },

    showNotification(message) {
      const notification = document.createElement('div')
      notification.textContent = message
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      document.body.appendChild(notification)

      setTimeout(() => {
        document.body.removeChild(notification)
      }, 2000)
    }
  },
  mounted() {
    // 设置初始内容
    this.textContent = '欢迎使用二维码工具！'
    this.generateQRCode()
  },
  beforeUnmount() {
    this.qrImageRequest++
    this.revokeQrImagePreview()
  }
}
</script>
