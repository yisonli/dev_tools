<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">RSA 加密/解密</h2>
        <p class="text-gray-600">
          RSA是一种非对称加密算法，使用公钥加密，私钥解密，或私钥签名，公钥验证。
        </p>
      </div>

      <!-- 密钥管理 -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">密钥管理</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              公钥 (Public Key)
            </label>
            <textarea
              v-model="publicKey"
              placeholder="-----BEGIN PUBLIC KEY-----&#10;请输入RSA公钥...&#10;-----END PUBLIC KEY-----"
              class="textarea-field h-24 font-mono text-sm"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              私钥 (Private Key)
            </label>
            <textarea
              v-model="privateKey"
              placeholder="-----BEGIN PRIVATE KEY-----&#10;请输入RSA私钥...&#10;-----END PRIVATE KEY-----"
              class="textarea-field h-24 font-mono text-sm"
            ></textarea>
          </div>
        </div>
        <div class="flex space-x-2">
          <button
            @click="generateKeyPair"
            class="btn btn-primary"
            :disabled="isGenerating"
          >
            {{ isGenerating ? '生成中...' : '生成密钥对' }}
          </button>
          <select v-model="keySize" class="input-field w-auto">
            <option value="1024">1024位</option>
            <option value="2048">2048位</option>
            <option value="4096">4096位</option>
          </select>
          <button
            @click="clearKeys"
            class="btn btn-secondary"
          >
            清空密钥
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 加密部分 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">公钥加密</h3>
          
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
              加密结果 (Base64)
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
              :disabled="!plainText || !publicKey"
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
          <h3 class="text-lg font-semibold text-gray-700">私钥解密</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              密文 (Base64)
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
              :disabled="!cipherText || !privateKey"
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

      <!-- 数字签名 -->
      <div class="mt-8">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">数字签名</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 签名生成 -->
          <div class="space-y-4">
            <h4 class="font-medium text-gray-700">签名生成</h4>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                待签名文本
              </label>
              <textarea
                v-model="signText"
                placeholder="请输入要签名的文本..."
                class="textarea-field h-24"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                签名结果 (Base64)
              </label>
              <textarea
                v-model="signature"
                readonly
                class="textarea-field h-24 bg-gray-50 font-mono text-sm"
                placeholder="签名结果将显示在这里..."
              ></textarea>
            </div>

            <div v-if="signError" class="text-red-600 text-sm">
              {{ signError }}
            </div>

            <div class="flex space-x-2">
              <button
                @click="signMessage"
                class="btn btn-primary"
                :disabled="!signText || !privateKey"
              >
                生成签名
              </button>
              <button
                @click="copySignature"
                class="btn btn-secondary"
                :disabled="!signature"
              >
                复制签名
              </button>
            </div>
          </div>

          <!-- 签名验证 -->
          <div class="space-y-4">
            <h4 class="font-medium text-gray-700">签名验证</h4>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                原始文本
              </label>
              <textarea
                v-model="verifyText"
                placeholder="请输入原始文本..."
                class="textarea-field h-24"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                签名 (Base64)
              </label>
              <textarea
                v-model="verifySignature"
                placeholder="请输入要验证的签名..."
                class="textarea-field h-24 font-mono text-sm"
              ></textarea>
            </div>

            <div v-if="verifyResult !== null" class="p-3 rounded-lg" :class="verifyResult ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
              {{ verifyResult ? '✓ 签名验证成功' : '✗ 签名验证失败' }}
            </div>

            <div v-if="verifyError" class="text-red-600 text-sm">
              {{ verifyError }}
            </div>

            <div class="flex space-x-2">
              <button
                @click="verifySignature"
                class="btn btn-primary"
                :disabled="!verifyText || !verifySignature || !publicKey"
              >
                验证签名
              </button>
              <button
                @click="clearVerify"
                class="btn btn-secondary"
              >
                清空
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 说明文档 -->
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• RSA加密：使用公钥加密，私钥解密</li>
          <li>• RSA签名：使用私钥签名，公钥验证</li>
          <li>• 密钥长度建议使用2048位或4096位</li>
          <li>• RSA加密有长度限制，明文长度不能超过密钥长度减去padding长度</li>
          <li>• 适用于加密少量数据或对称密钥交换</li>
          <li>• 所有操作在本地完成，密钥不会发送到服务器</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import JSEncrypt from 'jsencrypt'

export default {
  name: 'RsaTool',
  data() {
    return {
      publicKey: '',
      privateKey: '',
      keySize: '2048',
      isGenerating: false,
      
      plainText: '',
      encryptedText: '',
      encryptError: '',
      
      cipherText: '',
      decryptedText: '',
      decryptError: '',
      
      signText: '',
      signature: '',
      signError: '',
      
      verifyText: '',
      verifySignature: '',
      verifyResult: null,
      verifyError: ''
    }
  },
  methods: {
    async generateKeyPair() {
      this.isGenerating = true
      try {
        // 使用 setTimeout 让UI有时间更新
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const crypt = new JSEncrypt({ default_key_size: parseInt(this.keySize) })
        crypt.getKey()
        
        this.publicKey = crypt.getPublicKey()
        this.privateKey = crypt.getPrivateKey()
        
        this.showNotification('密钥对生成成功')
      } catch (error) {
        console.error('密钥生成错误:', error)
        this.showNotification('密钥生成失败', 'error')
      } finally {
        this.isGenerating = false
      }
    },
    
    encryptText() {
      try {
        this.encryptError = ''
        
        if (!this.plainText || !this.publicKey) {
          this.encryptError = '请输入明文和公钥'
          return
        }

        const encrypt = new JSEncrypt()
        encrypt.setPublicKey(this.publicKey)
        
        const encrypted = encrypt.encrypt(this.plainText)
        if (encrypted) {
          this.encryptedText = encrypted
        } else {
          this.encryptError = '加密失败：可能是明文过长或公钥格式错误'
        }
        
      } catch (error) {
        console.error('加密错误:', error)
        this.encryptError = '加密失败：' + error.message
      }
    },
    
    decryptText() {
      try {
        this.decryptError = ''
        
        if (!this.cipherText || !this.privateKey) {
          this.decryptError = '请输入密文和私钥'
          return
        }

        const decrypt = new JSEncrypt()
        decrypt.setPrivateKey(this.privateKey)
        
        const decrypted = decrypt.decrypt(this.cipherText)
        if (decrypted) {
          this.decryptedText = decrypted
        } else {
          this.decryptError = '解密失败：请检查密文格式和私钥'
        }
        
      } catch (error) {
        console.error('解密错误:', error)
        this.decryptError = '解密失败：' + error.message
      }
    },
    
    signMessage() {
      try {
        this.signError = ''
        
        if (!this.signText || !this.privateKey) {
          this.signError = '请输入要签名的文本和私钥'
          return
        }

        const sign = new JSEncrypt()
        sign.setPrivateKey(this.privateKey)
        
        const signature = sign.sign(this.signText, 'sha256')
        if (signature) {
          this.signature = signature
        } else {
          this.signError = '签名失败：请检查私钥格式'
        }
        
      } catch (error) {
        console.error('签名错误:', error)
        this.signError = '签名失败：' + error.message
      }
    },
    
    verifySignature() {
      try {
        this.verifyError = ''
        this.verifyResult = null
        
        if (!this.verifyText || !this.verifySignature || !this.publicKey) {
          this.verifyError = '请输入原始文本、签名和公钥'
          return
        }

        const verify = new JSEncrypt()
        verify.setPublicKey(this.publicKey)
        
        this.verifyResult = verify.verify(this.verifyText, this.verifySignature, 'sha256')
        
      } catch (error) {
        console.error('验证错误:', error)
        this.verifyError = '验证失败：' + error.message
      }
    },
    
    clearKeys() {
      this.publicKey = ''
      this.privateKey = ''
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
    
    clearVerify() {
      this.verifyText = ''
      this.verifySignature = ''
      this.verifyResult = null
      this.verifyError = ''
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
    
    async copySignature() {
      try {
        await navigator.clipboard.writeText(this.signature)
        this.showNotification('签名已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    },
    
    showNotification(message, type = 'success') {
      const notification = document.createElement('div')
      notification.textContent = message
      const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500'
      notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50`
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 2000)
    }
  }
}
</script>
