<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">AES 加密/解密</h2>
        <p class="text-gray-600">
          AES（Advanced Encryption Standard）是一种对称加密算法，支持128、192、256位密钥长度。
        </p>
      </div>

      <!-- 配置选项 -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">加密配置</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              加密模式
            </label>
            <select v-model="mode" class="input-field">
              <option value="CBC">CBC</option>
              <option value="ECB">ECB</option>
              <option value="CFB">CFB</option>
              <option value="OFB">OFB</option>
              <option value="CTR">CTR</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              填充方式
            </label>
            <select v-model="padding" class="input-field">
              <option value="Pkcs7">PKCS7</option>
              <option value="Iso97971">ISO 97971</option>
              <option value="AnsiX923">ANSI X923</option>
              <option value="NoPadding">No Padding</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              输出格式
            </label>
            <select v-model="outputFormat" class="input-field">
              <option value="Base64">Base64</option>
              <option value="Hex">十六进制</option>
            </select>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 加密部分 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">加密</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              密钥 (Key) 
              <span class="text-xs text-gray-500">支持16/24/32字节</span>
            </label>
            <input
              v-model="encryptKey"
              type="text"
              placeholder="请输入密钥..."
              class="input-field"
            />
          </div>

          <div v-if="mode !== 'ECB'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              初始向量 (IV)
              <span class="text-xs text-gray-500">16字节</span>
            </label>
            <input
              v-model="encryptIv"
              type="text"
              placeholder="请输入初始向量..."
              class="input-field"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              明文
            </label>
            <textarea
              v-model="plainText"
              placeholder="请输入要加密的文本..."
              class="textarea-field h-32"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              加密结果
            </label>
            <textarea
              v-model="encryptedText"
              readonly
              class="textarea-field h-32 bg-gray-50"
              placeholder="加密结果将显示在这里..."
            ></textarea>
          </div>

          <div v-if="encryptError" class="text-red-600 text-sm">
            {{ encryptError }}
          </div>

          <div class="flex space-x-2">
            <button
              @click="encryptText"
              class="btn btn-primary"
              :disabled="!plainText || !encryptKey"
            >
              加密
            </button>
            <button
              @click="copyEncrypted"
              class="btn btn-secondary flex items-center"
              :disabled="!encryptedText"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              复制
            </button>
            <button
              @click="clearEncrypt"
              class="btn btn-secondary"
            >
              清空
            </button>
          </div>
        </div>

        <!-- 解密部分 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">解密</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              密钥 (Key)
            </label>
            <input
              v-model="decryptKey"
              type="text"
              placeholder="请输入密钥..."
              class="input-field"
            />
          </div>

          <div v-if="mode !== 'ECB'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              初始向量 (IV)
            </label>
            <input
              v-model="decryptIv"
              type="text"
              placeholder="请输入初始向量..."
              class="input-field"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              密文
            </label>
            <textarea
              v-model="cipherText"
              placeholder="请输入要解密的密文..."
              class="textarea-field h-32"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              解密结果
            </label>
            <textarea
              v-model="decryptedText"
              readonly
              class="textarea-field h-32 bg-gray-50"
              placeholder="解密结果将显示在这里..."
            ></textarea>
          </div>

          <div v-if="decryptError" class="text-red-600 text-sm">
            {{ decryptError }}
          </div>

          <div class="flex space-x-2">
            <button
              @click="decryptText"
              class="btn btn-primary"
              :disabled="!cipherText || !decryptKey"
            >
              解密
            </button>
            <button
              @click="copyDecrypted"
              class="btn btn-secondary flex items-center"
              :disabled="!decryptedText"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              复制
            </button>
            <button
              @click="clearDecrypt"
              class="btn btn-secondary"
            >
              清空
            </button>
          </div>
        </div>
      </div>

      <!-- 工具按钮 -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 class="font-semibold text-gray-700 mb-3">工具</h4>
        <div class="flex flex-wrap gap-2">
          <button
            @click="generateRandomKey"
            class="btn btn-secondary text-sm"
          >
            生成随机密钥 (32字节)
          </button>
          <button
            @click="generateRandomIv"
            class="btn btn-secondary text-sm"
          >
            生成随机IV (16字节)
          </button>
        </div>
      </div>

      <!-- 说明文档 -->
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• AES密钥长度：16字节(AES-128)、24字节(AES-192)、32字节(AES-256)</li>
          <li>• IV长度：固定16字节（ECB模式不需要IV）</li>
          <li>• CBC模式最常用，安全性较高</li>
          <li>• ECB模式简单但安全性较低，不推荐用于敏感数据</li>
          <li>• 所有操作在本地完成，密钥和数据不会发送到服务器</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import CryptoJS from 'crypto-js'

export default {
  name: 'AesTool',
  data() {
    return {
      mode: 'CBC',
      padding: 'Pkcs7',
      outputFormat: 'Base64',
      
      encryptKey: '',
      encryptIv: '',
      plainText: '',
      encryptedText: '',
      encryptError: '',
      
      decryptKey: '',
      decryptIv: '',
      cipherText: '',
      decryptedText: '',
      decryptError: ''
    }
  },
  methods: {
    encryptText() {
      try {
        this.encryptError = ''
        
        if (!this.plainText || !this.encryptKey) {
          this.encryptError = '请输入明文和密钥'
          return
        }

        // 准备密钥和IV
        const key = CryptoJS.enc.Utf8.parse(this.encryptKey)
        const iv = this.mode !== 'ECB' ? CryptoJS.enc.Utf8.parse(this.encryptIv || '0000000000000000') : undefined

        // 获取加密模式
        const mode = CryptoJS.mode[this.mode]
        const padding = CryptoJS.pad[this.padding]

        // 加密配置
        const config = {
          mode: mode,
          padding: padding
        }

        if (iv) {
          config.iv = iv
        }

        // 执行加密
        const encrypted = CryptoJS.AES.encrypt(this.plainText, key, config)
        
        // 格式化输出
        if (this.outputFormat === 'Base64') {
          this.encryptedText = encrypted.toString()
        } else {
          this.encryptedText = encrypted.ciphertext.toString()
        }
        
      } catch (error) {
        console.error('加密错误:', error)
        this.encryptError = '加密失败：' + error.message
        this.encryptedText = ''
      }
    },
    
    decryptText() {
      try {
        this.decryptError = ''
        
        if (!this.cipherText || !this.decryptKey) {
          this.decryptError = '请输入密文和密钥'
          return
        }

        // 准备密钥和IV
        const key = CryptoJS.enc.Utf8.parse(this.decryptKey)
        const iv = this.mode !== 'ECB' ? CryptoJS.enc.Utf8.parse(this.decryptIv || '0000000000000000') : undefined

        // 获取加密模式
        const mode = CryptoJS.mode[this.mode]
        const padding = CryptoJS.pad[this.padding]

        // 解密配置
        const config = {
          mode: mode,
          padding: padding
        }

        if (iv) {
          config.iv = iv
        }

        // 执行解密
        const decrypted = CryptoJS.AES.decrypt(this.cipherText, key, config)
        this.decryptedText = decrypted.toString(CryptoJS.enc.Utf8)
        
        if (!this.decryptedText) {
          this.decryptError = '解密失败：请检查密钥、IV或密文格式'
        }
        
      } catch (error) {
        console.error('解密错误:', error)
        this.decryptError = '解密失败：' + error.message
        this.decryptedText = ''
      }
    },
    
    generateRandomKey() {
      const key = CryptoJS.lib.WordArray.random(32).toString()
      this.encryptKey = key
      this.decryptKey = key
    },
    
    generateRandomIv() {
      const iv = CryptoJS.lib.WordArray.random(16).toString().substring(0, 16)
      this.encryptIv = iv
      this.decryptIv = iv
    },
    
    async copyEncrypted() {
      try {
        await navigator.clipboard.writeText(this.encryptedText)
        this.showNotification('加密结果已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    },
    
    async copyDecrypted() {
      try {
        await navigator.clipboard.writeText(this.decryptedText)
        this.showNotification('解密结果已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    },
    
    clearEncrypt() {
      this.plainText = ''
      this.encryptedText = ''
      this.encryptError = ''
    },
    
    clearDecrypt() {
      this.cipherText = ''
      this.decryptedText = ''
      this.decryptError = ''
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
  watch: {
    mode() {
      // 清空之前的结果
      this.encryptedText = ''
      this.decryptedText = ''
      this.encryptError = ''
      this.decryptError = ''
    }
  }
}
</script>
