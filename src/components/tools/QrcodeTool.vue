<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">二维码生成/解析</h2>
        <p class="text-gray-600">
          生成各种内容的二维码，支持文本、URL、WiFi、联系人等，也可以解析二维码图片内容。
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 二维码生成 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">二维码生成</h3>
          
          <!-- 内容类型选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              内容类型
            </label>
            <select v-model="contentType" @change="onContentTypeChange" class="input-field">
              <option value="text">普通文本</option>
              <option value="url">网址链接</option>
              <option value="wifi">WiFi信息</option>
              <option value="contact">联系人信息</option>
              <option value="sms">短信</option>
              <option value="email">邮件</option>
            </select>
          </div>

          <!-- 动态内容输入 -->
          <div v-if="contentType === 'text'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              文本内容
            </label>
            <textarea
              v-model="textContent"
              placeholder="请输入要生成二维码的文本..."
              class="textarea-field h-20"
              @input="generateQRCode"
            ></textarea>
          </div>

          <div v-else-if="contentType === 'url'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              网址URL
            </label>
            <input
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
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  WiFi名称(SSID)
                </label>
                <input
                  v-model="wifiData.ssid"
                  placeholder="WiFi名称"
                  class="input-field"
                  @input="generateQRCode"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  加密类型
                </label>
                <select v-model="wifiData.security" @change="generateQRCode" class="input-field">
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">无密码</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                WiFi密码
              </label>
              <input
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
                placeholder="姓名"
                class="input-field"
                @input="generateQRCode"
              />
              <input
                v-model="contactData.phone"
                placeholder="电话号码"
                class="input-field"
                @input="generateQRCode"
              />
            </div>
            <input
              v-model="contactData.email"
              placeholder="邮箱地址"
              class="input-field"
              @input="generateQRCode"
            />
            <input
              v-model="contactData.organization"
              placeholder="公司/组织"
              class="input-field"
              @input="generateQRCode"
            />
          </div>

          <!-- 二维码设置 -->
          <div class="p-3 bg-gray-50 rounded-lg">
            <h4 class="font-medium text-gray-700 mb-3">二维码设置</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm text-gray-600 mb-1">尺寸</label>
                <select v-model="qrOptions.width" @change="generateQRCode" class="input-field text-sm">
                  <option :value="200">200x200</option>
                  <option :value="300">300x300</option>
                  <option :value="400">400x400</option>
                  <option :value="500">500x500</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-gray-600 mb-1">纠错级别</label>
                <select v-model="qrOptions.errorCorrectionLevel" @change="generateQRCode" class="input-field text-sm">
                  <option value="L">低 (7%)</option>
                  <option value="M">中 (15%)</option>
                  <option value="Q">较高 (25%)</option>
                  <option value="H">高 (30%)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 二维码显示 -->
          <div>
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

          <div class="flex space-x-2">
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

      <!-- 说明文档 -->
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• 支持多种内容类型：文本、URL、WiFi、联系人、短信、邮件</li>
          <li>• 可调整二维码尺寸和错误纠正级别</li>
          <li>• 支持从图片文件解析二维码内容</li>
          <li>• 生成的二维码可以下载保存</li>
          <li>• 所有操作在本地完成，图片不会上传到服务器</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import QRCode from 'qrcode'
import QrScanner from 'qr-scanner'

export default {
  name: 'QrcodeTool',
  data() {
    return {
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
      
      uploadedImage: null,
      parseResult: '',
      parseError: '',
      isParsing: false
    }
  },
  methods: {
    onContentTypeChange() {
      this.qrGenerated = false
      this.clearCanvas()
      this.generateQRCode()
    },
    
    generateQRCode() {
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
          return `sms:${this.contactData.phone}?body=${this.textContent}`
        case 'email':
          return `mailto:${this.contactData.email}?subject=${this.textContent}`
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
  }
}
</script>
