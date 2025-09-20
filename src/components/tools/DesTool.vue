<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">DES 加密/解密</h2>
        <p class="text-gray-600">
          DES（Data Encryption Standard）是一种对称加密算法，支持DES和3DES加密。注意：DES安全性较低，建议使用AES。
        </p>
      </div>

      <!-- 配置选项 -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">加密配置</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              加密算法
            </label>
            <select v-model="algorithm" class="input-field">
              <option value="DES">DES</option>
              <option value="TripleDES">3DES</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              加密模式
            </label>
            <select v-model="mode" class="input-field">
              <option value="CBC">CBC</option>
              <option value="ECB">ECB</option>
              <option value="CFB">CFB</option>
              <option value="OFB">OFB</option>
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
              <span class="text-xs text-gray-500">{{ getKeyDescription() }}</span>
            </label>
            <input
              v-model="encryptKey"
              type="text"
              :placeholder="getKeyPlaceholder()"
              class="input-field font-mono"
            />
          </div>

          <div v-if="mode !== 'ECB'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              初始向量 (IV)
              <span class="text-xs text-gray-500">8字节</span>
            </label>
            <input
              v-model="encryptIv"
              type="text"
              placeholder="请输入8字节初始向量"
              class="input-field font-mono"
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
              class="textarea-field h-32 bg-gray-50 font-mono text-sm"
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
              :placeholder="getKeyPlaceholder()"
              class="input-field font-mono"
            />
          </div>

          <div v-if="mode !== 'ECB'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              初始向量 (IV)
            </label>
            <input
              v-model="decryptIv"
              type="text"
              placeholder="请输入8字节初始向量"
              class="input-field font-mono"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              密文
            </label>
            <textarea
              v-model="cipherText"
              placeholder="请输入要解密的密文..."
              class="textarea-field h-32 font-mono text-sm"
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
            生成随机密钥
          </button>
          <button
            @click="generateRandomIv"
            class="btn btn-secondary text-sm"
          >
            生成随机IV
          </button>
          <button
            @click="testWithExample"
            class="btn btn-secondary text-sm"
          >
            使用示例数据
          </button>
        </div>
      </div>

      <!-- 安全警告 -->
      <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <h4 class="font-semibold text-yellow-800">安全警告</h4>
            <p class="text-sm text-yellow-700 mt-1">
              DES算法因密钥长度较短（56位）已被认为不够安全，容易被暴力破解。推荐使用AES算法进行新项目的加密需求。
              3DES相对安全但性能较差，同样建议使用AES替代。
            </p>
          </div>
        </div>
      </div>

      <!-- 说明文档 -->
      <div class="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• DES密钥长度：8字节（64位，实际56位有效）</li>
          <li>• 3DES密钥长度：16字节或24字节</li>
          <li>• IV长度：8字节（ECB模式不需要IV）</li>
          <li>• CBC模式最常用，ECB模式安全性较低</li>
          <li>• 所有操作在本地完成，密钥和数据不会发送到服务器</li>
          <li>• 建议优先使用AES算法替代DES</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import CryptoJS from 'crypto-js'

export default {
  name: 'DesTool',
  data() {
    return {
      algorithm: 'DES',
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
    getKeyDescription() {
      return this.algorithm === 'DES' ? '8字节（64位）' : '16字节或24字节'
    },
    
    getKeyPlaceholder() {
      return this.algorithm === 'DES' ? '请输入8字节密钥' : '请输入16或24字节密钥'
    },
    
    encryptText() {
      try {
        this.encryptError = ''
        
        if (!this.plainText || !this.encryptKey) {
          this.encryptError = '请输入明文和密钥'
          return
        }

        // 验证密钥长度
        if (!this.validateKeyLength(this.encryptKey)) {
          return
        }

        // 准备密钥和IV
        const key = CryptoJS.enc.Utf8.parse(this.encryptKey)
        const iv = this.mode !== 'ECB' ? CryptoJS.enc.Utf8.parse(this.encryptIv || '00000000') : undefined

        // 获取加密模式和填充方式
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
        let encrypted
        if (this.algorithm === 'DES') {
          encrypted = CryptoJS.DES.encrypt(this.plainText, key, config)
        } else {
          encrypted = CryptoJS.TripleDES.encrypt(this.plainText, key, config)
        }
        
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

        // 验证密钥长度
        if (!this.validateKeyLength(this.decryptKey)) {
          return
        }

        // 准备密钥和IV
        const key = CryptoJS.enc.Utf8.parse(this.decryptKey)
        const iv = this.mode !== 'ECB' ? CryptoJS.enc.Utf8.parse(this.decryptIv || '00000000') : undefined

        // 获取加密模式和填充方式
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
        let decrypted
        if (this.algorithm === 'DES') {
          decrypted = CryptoJS.DES.decrypt(this.cipherText, key, config)
        } else {
          decrypted = CryptoJS.TripleDES.decrypt(this.cipherText, key, config)
        }
        
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
    
    validateKeyLength(key) {
      const keyBytes = new TextEncoder().encode(key).length
      
      if (this.algorithm === 'DES') {
        if (keyBytes !== 8) {
          this.encryptError = this.decryptError = 'DES密钥必须是8字节长度'
          return false
        }
      } else { // TripleDES
        if (keyBytes !== 16 && keyBytes !== 24) {
          this.encryptError = this.decryptError = '3DES密钥必须是16字节或24字节长度'
          return false
        }
      }
      
      return true
    },
    
    generateRandomKey() {
      const keyLength = this.algorithm === 'DES' ? 8 : 16
      const key = CryptoJS.lib.WordArray.random(keyLength).toString().substring(0, keyLength)
      this.encryptKey = key
      this.decryptKey = key
    },
    
    generateRandomIv() {
      const iv = CryptoJS.lib.WordArray.random(8).toString().substring(0, 8)
      this.encryptIv = iv
      this.decryptIv = iv
    },
    
    testWithExample() {
      if (this.algorithm === 'DES') {
        this.encryptKey = 'mydeskey'
        this.decryptKey = 'mydeskey'
      } else {
        this.encryptKey = 'my3deskeyfor1234'
        this.decryptKey = 'my3deskeyfor1234'
      }
      this.encryptIv = '12345678'
      this.decryptIv = '12345678'
      this.plainText = '这是一个DES加密测试'
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
    algorithm() {
      // 算法改变时清空结果
      this.encryptedText = ''
      this.decryptedText = ''
      this.encryptError = ''
      this.decryptError = ''
    },
    mode() {
      // 模式改变时清空结果
      this.encryptedText = ''
      this.decryptedText = ''
      this.encryptError = ''
      this.decryptError = ''
    }
  }
}
</script>
