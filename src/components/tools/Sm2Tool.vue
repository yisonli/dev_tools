<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">SM2 加密/解密</h2>
        <p class="text-gray-600">
          SM2是中国国密标准的椭圆曲线公钥密码算法，支持加密解密、数字签名和密钥交换。
        </p>
      </div>

      <!-- 密钥管理 -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">密钥管理</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              公钥 (Public Key)
              <span class="text-xs text-gray-500">128字符十六进制（不含04前缀）</span>
            </label>
            <textarea
              v-model="publicKey"
              placeholder="请输入SM2公钥（十六进制格式）..."
              class="textarea-field h-20 font-mono text-sm"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              私钥 (Private Key)
              <span class="text-xs text-gray-500">64字符十六进制</span>
            </label>
            <textarea
              v-model="privateKey"
              placeholder="请输入SM2私钥（十六进制格式）..."
              class="textarea-field h-20 font-mono text-sm"
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
          <button @click="clearKeys" class="btn btn-secondary">清空密钥</button>
        </div>
      </div>

      <!-- 加密参数配置 -->
      <div class="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 class="text-lg font-semibold text-blue-800 mb-4">🔧 加密参数配置</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 密文编码方式 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              密文编码方式
            </label>
            <select v-model="cipherEncoding" class="input-field">
              <option value="auto">自动检测 (推荐)</option>
              <option value="plain">普通编码 (Plain)</option>
              <option value="asn1">ASN.1编码 (国密标准)</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">
              ASN.1兼容Go/Java等标准实现
            </p>
          </div>

          <!-- 椭圆曲线点序列化模式 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              点序列化模式
            </label>
            <select v-model="pointMarshalMode" class="input-field">
              <option value="uncompressed">非压缩模式</option>
              <option value="compressed">压缩模式</option>
              <option value="hybrid">混合模式</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">
              ASN.1编码时此项不生效
            </p>
          </div>

          <!-- 密文拼接顺序 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              密文拼接顺序
            </label>
            <select v-model="cipherSplicing" class="input-field">
              <option value="C1C3C2">C1C3C2 (新标准)</option>
              <option value="C1C2C3">C1C2C3 (旧标准)</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">
              ASN.1编码时此项不生效
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 加密部分 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">公钥加密</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">明文</label>
            <textarea
              v-model="plainText"
              placeholder="请输入要加密的文本..."
              class="textarea-field h-32"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">加密结果</label>
            <textarea
              v-model="encryptedText"
              readonly
              class="textarea-field h-32 bg-gray-50 font-mono text-sm"
              placeholder="加密结果将显示在这里..."
            ></textarea>
          </div>

          <div v-if="encryptError" class="text-red-600 text-sm">{{ encryptError }}</div>

          <div class="flex space-x-2">
            <button @click="encryptText" class="btn btn-primary" :disabled="!plainText || !publicKey">
              加密
            </button>
            <button @click="copyEncrypted" class="btn btn-secondary flex items-center" :disabled="!encryptedText">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              复制
            </button>
            <button @click="clearEncrypt" class="btn btn-secondary">清空</button>
          </div>
        </div>

        <!-- 解密部分 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">私钥解密</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">密文</label>
            <textarea
              v-model="cipherText"
              placeholder="请输入要解密的密文..."
              class="textarea-field h-32 font-mono text-sm"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">解密结果</label>
            <textarea
              v-model="decryptedText"
              readonly
              class="textarea-field h-32 bg-gray-50"
              placeholder="解密结果将显示在这里..."
            ></textarea>
          </div>

          <div v-if="decryptError" class="text-red-600 text-sm">{{ decryptError }}</div>

          <div class="flex space-x-2">
            <button @click="decryptText" class="btn btn-primary" :disabled="!cipherText || !privateKey">
              解密
            </button>
            <button @click="copyDecrypted" class="btn btn-secondary flex items-center" :disabled="!decryptedText">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              复制
            </button>
            <button @click="clearDecrypt" class="btn btn-secondary">清空</button>
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
              <label class="block text-sm font-medium text-gray-700 mb-2">待签名文本</label>
              <textarea v-model="signText" placeholder="请输入要签名的文本..." class="textarea-field h-24"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">用户标识 (可选)</label>
              <input v-model="userId" type="text" placeholder="默认为: 1234567812345678" class="input-field" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">签名结果 (十六进制)</label>
              <textarea v-model="signature" readonly class="textarea-field h-24 bg-gray-50 font-mono text-sm" placeholder="签名结果将显示在这里..."></textarea>
            </div>

            <div v-if="signError" class="text-red-600 text-sm">{{ signError }}</div>

            <div class="flex space-x-2">
              <button @click="signMessage" class="btn btn-primary" :disabled="!signText || !privateKey">生成签名</button>
              <button @click="copySignature" class="btn btn-secondary" :disabled="!signature">复制签名</button>
            </div>
          </div>

          <!-- 签名验证 -->
          <div class="space-y-4">
            <h4 class="font-medium text-gray-700">签名验证</h4>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">原始文本</label>
              <textarea v-model="verifyText" placeholder="请输入原始文本..." class="textarea-field h-24"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">用户标识 (可选)</label>
              <input v-model="verifyUserId" type="text" placeholder="默认为: 1234567812345678" class="input-field" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">签名 (十六进制)</label>
              <textarea v-model="verifySignature" placeholder="请输入要验证的签名..." class="textarea-field h-24 font-mono text-sm"></textarea>
            </div>

            <div v-if="verifyResult !== null" class="p-3 rounded-lg" :class="verifyResult ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
              {{ verifyResult ? '✓ 签名验证成功' : '✗ 签名验证失败' }}
            </div>

            <div v-if="verifyError" class="text-red-600 text-sm">{{ verifyError }}</div>

            <div class="flex space-x-2">
              <button @click="doVerifySignature" class="btn btn-primary" :disabled="!verifyText || !verifySignature || !publicKey">验证签名</button>
              <button @click="clearVerify" class="btn btn-secondary">清空</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 说明文档 -->
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• SM2是中国国密标准，基于椭圆曲线的非对称加密算法</li>
          <li>• <strong>密文编码方式</strong>：ASN.1为国密标准格式，兼容Go crypto/sm2、Java BC等；普通编码为原始hex拼接</li>
          <li>• <strong>点序列化模式</strong>：控制C1点的表示方式，ASN.1编码时自动忽略（C1.x和C1.y分开存储）</li>
          <li>• <strong>密文拼接顺序</strong>：C1C3C2为新标准（推荐），C1C2C3为旧标准</li>
          <li>• 公钥长度为128个十六进制字符（不含04前缀），私钥长度为64个十六进制字符</li>
          <li>• 数字签名支持用户标识，默认为"1234567812345678"</li>
          <li>• 所有操作在本地完成，密钥和数据不会发送到服务器</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { sm2 } from 'sm-crypto'
import {
  sm2EncryptFull, sm2DecryptFull,
  normalizeSignature, normalizeSignatureToDer, detectSignatureFormat
} from '../../utils/sm2-asn1'

export default {
  name: 'Sm2Tool',
  data() {
    return {
      // 密钥
      publicKey: '',
      privateKey: '',
      isGenerating: false,

      // 加密参数（共享配置）
      cipherEncoding: 'auto',
      pointMarshalMode: 'uncompressed',
      cipherSplicing: 'C1C3C2',

      // 加密
      plainText: '',
      encryptedText: '',
      encryptError: '',

      // 解密
      cipherText: '',
      decryptedText: '',
      decryptError: '',

      // 签名
      signText: '',
      userId: '',
      signature: '',
      signError: '',

      // 验签
      verifyText: '',
      verifyUserId: '',
      verifySignature: '',
      verifyResult: null,
      verifyError: ''
    }
  },
  methods: {
    async generateKeyPair() {
      this.isGenerating = true
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        const keypair = sm2.generateKeyPairHex()
        this.publicKey = keypair.publicKey
        this.privateKey = keypair.privateKey
        this.showNotification('SM2密钥对生成成功')
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
        this.encryptedText = sm2EncryptFull(this.plainText, this.publicKey, {
          cipherEncoding: this.cipherEncoding,
          pointMarshalMode: this.pointMarshalMode,
          cipherSplicing: this.cipherSplicing
        })
      } catch (error) {
        console.error('加密错误:', error)
        this.encryptError = '加密失败：' + error.message
        this.encryptedText = ''
      }
    },

    decryptText() {
      try {
        this.decryptError = ''
        if (!this.cipherText || !this.privateKey) {
          this.decryptError = '请输入密文和私钥'
          return
        }
        this.decryptedText = sm2DecryptFull(this.cipherText, this.privateKey, {
          cipherEncoding: this.cipherEncoding,
          pointMarshalMode: this.pointMarshalMode,
          cipherSplicing: this.cipherSplicing
        })
      } catch (error) {
        console.error('解密错误:', error)
        this.decryptError = '解密失败：' + error.message
        this.decryptedText = ''
      }
    },

    signMessage() {
      try {
        this.signError = ''
        if (!this.signText || !this.privateKey) {
          this.signError = '请输入要签名的文本和私钥'
          return
        }
        const userIdToUse = this.userId || '1234567812345678'
        this.signature = sm2.doSignature(this.signText, this.privateKey, { userId: userIdToUse })
      } catch (error) {
        console.error('签名错误:', error)
        this.signError = '签名失败：' + error.message
        this.signature = ''
      }
    },

    doVerifySignature() {
      try {
        this.verifyError = ''
        this.verifyResult = null
        if (!this.verifyText || !this.verifySignature || !this.publicKey) {
          this.verifyError = '请输入原始文本、签名和公钥'
          return
        }
        const userIdToUse = this.verifyUserId || '1234567812345678'
        // 自动检测签名格式：raw (128字符) 或 ASN.1 DER (>128字符)
        const sigFormat = detectSignatureFormat(this.verifySignature.trim())
        this.verifyResult = sm2.doVerifySignature(this.verifyText, this.verifySignature.trim(), this.publicKey, {
          userId: userIdToUse,
          der: sigFormat === 'der'
        })
      } catch (error) {
        console.error('验证错误:', error)
        this.verifyError = '验证失败：' + error.message
        this.verifyResult = false
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
      this.verifyUserId = ''
      this.verifySignature = ''
      this.verifyResult = null
      this.verifyError = ''
    },

    async copyEncrypted() {
      try {
        await navigator.clipboard.writeText(this.encryptedText)
        this.showNotification('加密结果已复制')
      } catch (e) { console.error(e) }
    },

    async copyDecrypted() {
      try {
        await navigator.clipboard.writeText(this.decryptedText)
        this.showNotification('解密结果已复制')
      } catch (e) { console.error(e) }
    },

    async copySignature() {
      try {
        await navigator.clipboard.writeText(this.signature)
        this.showNotification('签名已复制')
      } catch (e) { console.error(e) }
    },

    showNotification(message, type = 'success') {
      const notification = document.createElement('div')
      notification.textContent = message
      notification.className = 'fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ' +
        (type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white')
      document.body.appendChild(notification)
      setTimeout(() => { document.body.removeChild(notification) }, 2000)
    }
  }
}
</script>
